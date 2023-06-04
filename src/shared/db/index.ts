import {
  Attributes,
  InitOptions,
  Model,
  ModelAttributeColumnOptions,
  ModelAttributes,
  ModelOptions,
  ModelStatic,
  Sequelize,
} from 'sequelize'
import { config } from '../config/index'
import logger from '../logger'

export const commonOptions: ModelOptions = {
  timestamps: true,
  underscored: true,
}
export interface Join {
  type: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  target: ModelStatic<Model>
  as?: string
  foreignKey?: string
  otherKey?: string
  through?: ModelStatic<Model> | string
}

export type EntityDefinition<T extends object> = {
  [key in keyof T]: ModelAttributeColumnOptions<Model<T>>
}

export interface EntityConfig<M extends Model = Model> {
  name: string
  attributes: ModelAttributes<M, Attributes<M>>
  roles?: string[]
  publicRead?: boolean
  publicWrite?: boolean
  model?: ModelStatic<M>
  joins?: Join[]
  options?: Partial<InitOptions<M>>
  onChanges?: (source?: string, model?: M) => Promise<void> | void
}

export function sortEntities(a: EntityConfig, b: EntityConfig): number {
  if (a.name === 'user') {
    return -1
  }
  if (b.name === 'user') {
    return 1
  }
  const primaryKeysA = Object.keys(a.attributes).filter(
    key => (a.attributes[key] as ModelAttributeColumnOptions).primaryKey,
  )
  const primaryKeysB = Object.keys(b.attributes).filter(
    key => (b.attributes[key] as ModelAttributeColumnOptions).primaryKey,
  )
  if (
    Object.keys(b.attributes).some(
      key =>
        !(b.attributes[key] as ModelAttributeColumnOptions).primaryKey &&
        primaryKeysA.includes(key),
    )
  ) {
    return -1
  } else if (
    Object.keys(a.attributes).some(
      key =>
        !(a.attributes[key] as ModelAttributeColumnOptions).primaryKey &&
        primaryKeysB.includes(key),
    )
  ) {
    return 1
  } else {
    return 0
  }
}

export class Connection {
  public static entities: EntityConfig[] = []
  public static db: Sequelize
  static initialized = false
  static init() {
    if (Connection.initialized) {
      logger.warn('Connection already initialized')
      return
    }
    const checkRuntime = config
    if (!checkRuntime) {
      throw new Error(
        'Connection Class cannot read config, undefined variable - check for cyclic dependency',
      )
    }
    if (!config.db.url || !config.db.database) {
      logger.error('DB URL not found, skipping DB init')
      return
    }
    if (config.db.trace) {
      logger.info(`Initializing DB...`)
    }
    try {
      Connection.db = new Sequelize(config.db.url, {
        logging: sql => (config.db.trace ? logger.info(`${sql}\n`) : undefined),
        ssl: !!config.db.ssl,
        dialectOptions: config.db.ssl
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : {},
      })
    } catch (error) {
      logger.error('Error initializing DB', error)
      return
    }
    const sorted = Connection.entities.sort(sortEntities)
    Connection.initModels(sorted)
    Connection.initJoins(sorted)
    Connection.autoDetectJoins(sorted)
    Connection.initialized = true
  }

  static getAssociations(name: string) {
    const entity = Connection.entities.find(e => e.name == name)
    if (!entity) {
      throw new Error(`Entity ${name} not found`)
    }
    const primaryKeys = Object.keys(entity.attributes).filter(
      key => (entity.attributes[key] as ModelAttributeColumnOptions).primaryKey,
    )
    const others = Connection.entities.filter(e => e.name !== name)
    const associations = others.filter(related => primaryKeys.some(key => related.attributes[key]))
    return associations
  }
  static initModels(sorted: EntityConfig[]) {
    for (const entity of sorted) {
      const scopedOptions = {
        ...commonOptions,
        ...entity.options,
        sequelize: Connection.db,
        modelName: entity.name,
      }
      if (!entity.model) {
        logger.error(`Entity without model: ${entity.name}`)
        continue
      }
      if (entity.model.name === 'model') {
        entity.model.init(entity.attributes, scopedOptions)
      }
    }
  }
  static initJoins(sorted: EntityConfig[]) {
    for (const entity of sorted) {
      if (!entity?.model) {
        return
      }
      const joins = entity.joins ?? []
      for (const join of joins) {
        entity.model[join.type](join.target as ModelStatic<Model>, {
          foreignKey: join.foreignKey as string,
          otherKey: join.otherKey as string,
          through: join.through as ModelStatic<Model>,
          as: join.as as string,
        })
      }
    }
  }

  /**
   * Detect joins based on fieldId naming convention
   * */
  static autoDetectJoins(sorted: EntityConfig[]) {
    for (const entity of sorted) {
      if (!entity?.model) {
        return
      }
      const otherModels = Connection.entities.filter(e => e.name !== entity.name)
      for (const other of otherModels) {
        if (entity.model.associations[other.name]) {
          continue
        }
        const otherPrimaryKeys = Object.keys(other.attributes).filter(
          key => (other.attributes[key] as ModelAttributeColumnOptions).primaryKey,
        )
        for (const otherPrimaryKey of otherPrimaryKeys) {
          const columnDef = entity.attributes[otherPrimaryKey] as ModelAttributeColumnOptions
          if (otherPrimaryKey.endsWith('Id') && columnDef && !columnDef.primaryKey) {
            entity.model.belongsTo(other.model as ModelStatic<Model>, {
              foreignKey: otherPrimaryKey,
              onDelete: 'CASCADE',
            })
            other.model?.hasMany(entity.model, {
              foreignKey: otherPrimaryKey,
            })
          }
        }
      }
    }
  }
}

export async function createDatabase(): Promise<boolean> {
  logger.info('Database does not exist, creating...')

  const rootUrl = config.db.url.replace(config.db.database, 'postgres')
  const root = new Sequelize(rootUrl)
  const qi = root.getQueryInterface()
  try {
    await qi.createDatabase(config.db.database)
    logger.info('Database created: ' + config.db.database)
    await Connection.db.sync()
    logger.info('Tables created')
  } catch (e: unknown) {
    logger.warn('Database creation failed: ' + JSON.stringify(e), e)
    return false
  }
  return true
}

/**
 * Deferred model registration for
 * sequelize and model-api endpoints
 *
 * @param name - table name
 * @param attributes - columns definitions
 * @param roles - restrict to roles like Admin
 * @param publicRead - Set GET and LIST public (no token needed)
 * @param publicWrite - POST, PUT, PATCH (no token needed)
 * @returns Typed model class reference with methods/utilities
 */
export function addModel<T extends object>({
  name,
  attributes,
  joins,
  roles,
  publicRead,
  publicWrite,
  onChanges,
  options,
}: EntityConfig<Model<T>>): ModelStatic<Model<T, T>> {
  const model = class extends Model {}
  const cfg: EntityConfig = {
    name,
    attributes,
    joins,
    roles,
    model,
    publicRead,
    publicWrite,
    onChanges,
    options,
  }
  Connection.entities.push(cfg)
  return model
}

export default Connection
