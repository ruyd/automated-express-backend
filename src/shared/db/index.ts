import {
  Attributes,
  Model,
  ModelAttributeColumnOptions,
  ModelAttributes,
  ModelOptions,
  ModelStatic,
  Sequelize,
} from 'sequelize'
import migrator from './migrator'
import { config } from '../config'
import logger from '../logger'

export const commonOptions: ModelOptions = {
  timestamps: true,
  underscored: true,
}
export interface Join {
  relation: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  model: ModelStatic<Model>
  as: string
  foreignKey: string
}

export interface EntityConfig<M extends Model = Model> {
  name: string
  attributes: ModelAttributes<M, Attributes<M>>
  roles?: string[]
  publicRead?: boolean
  publicWrite?: boolean
  model?: ModelStatic<M>
  joins?: Join[]
  onChanges?: (source?: string, model?: M) => Promise<void> | void
}

export function sortEntities(a: EntityConfig, b: EntityConfig): number {
  const primaryKeysA = Object.keys(a.attributes).filter(
    key => (a.attributes[key] as ModelAttributeColumnOptions).primaryKey,
  )
  const primaryKeysB = Object.keys(b.attributes).filter(
    key => (b.attributes[key] as ModelAttributeColumnOptions).primaryKey,
  )
  if (primaryKeysA.some(key => b.attributes[key])) {
    return -1
  }
  if (primaryKeysB.some(key => a.attributes[key])) {
    return 1
  }
  return 0
}

export class Connection {
  public static entities: EntityConfig[] = []
  public static db: Sequelize
  static initialized = false
  static init() {
    const checkRuntime = config
    if (!checkRuntime) {
      throw new Error(
        'Connection Class cannot read config, undefined variable - check for cyclic dependency',
      )
    }
    if (!config.db.url || !config.db.name) {
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
    Connection.initModels()
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
  static initModels() {
    const sorted = Connection.entities.sort(sortEntities)
    for (const entity of sorted) {
      const scopedOptions = { ...commonOptions, sequelize: Connection.db, modelName: entity.name }
      if (!entity.model) {
        logger.error(`Model ${entity.name} not found`)
        continue
      }
      entity.model.init(entity.attributes, scopedOptions)
    }
    for (const entity of sorted) {
      Connection.initJoins(entity)
    }
  }
  static initJoins(entity: EntityConfig) {
    if (!entity?.model) {
      return
    }
    // Passed joins
    for (const join of entity.joins || []) {
      entity.model[join.relation](join.model, {
        through: join.model,
        as: join.as as string,
        foreignKey: join.foreignKey as string,
      })
    }
    // Detect joins based on column names
    const otherModels = Connection.entities.filter(e => e.name !== entity.name)
    for (const related of otherModels) {
      if (related.model?.name === 'model') {
        throw new Error('model not initialized for' + related.name)
      }
      const relatedColumns = Object.keys(related.attributes).filter(
        key => (related.attributes[key] as ModelAttributeColumnOptions).primaryKey,
      )
      for (const relatedColumnPk of relatedColumns) {
        if (relatedColumnPk.endsWith('Id') && entity.attributes[relatedColumnPk]) {
          entity.model.belongsTo(related.model as ModelStatic<Model>, {
            foreignKey: relatedColumnPk,
            onDelete: 'CASCADE',
          })
          const propName = entity.model.tableName.replace(related.model?.name + '_', '')
          related.model?.hasMany(entity.model, {
            foreignKey: relatedColumnPk,
            as: propName,
          })
        }
      }
    }
  }
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
export function addModel<T extends object>(
  name: string,
  attributes: ModelAttributes<Model<T>, Attributes<Model<T>>>,
  joins?: Join[],
  roles?: string[],
  publicRead?: boolean,
  publicWrite?: boolean,
  onChanges?: (source?: string, model?: Model<T>) => Promise<void> | void,
): ModelStatic<Model<T, T>> {
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
  }
  Connection.entities.push(cfg)
  if (config.db.trace) {
    logger.info(`Registered model ${name}`)
  }
  return model
}

export async function createDatabase(): Promise<boolean> {
  logger.info('Database does not exist, creating...')

  const rootUrl = config.db.url.replace(config.db.name, 'postgres')
  const root = new Sequelize(rootUrl)
  const qi = root.getQueryInterface()
  try {
    await qi.createDatabase(config.db.name)
    logger.info('Database created: ' + config.db.name)
    await Connection.db.sync()
    logger.info('Tables created')
  } catch (e: unknown) {
    logger.warn('Database creation failed: ' + JSON.stringify(e), e)
    return false
  }
  return true
}

export async function checkMigrations(): Promise<boolean> {
  const pending = await migrator.pending()
  if (pending.length > 0) {
    logger.info('Pending migrations', pending)

    try {
      const result = await migrator.up()
      logger.info('Migrations applied', result)
    } catch (e: unknown) {
      logger.error('Migration failed, reverting...', e)
      const down = await migrator.down()
      logger.info('Migrations reverted', down)

      return false
    }
  }
  return true
}

export async function checkDatabase(): Promise<boolean> {
  if (!Connection.initialized) {
    logger.error('DB Connection not initialized')
    return false
  }
  try {
    logger.info('Connecting to database...')
    config.db.models = Connection.entities.map(m => m.name)
    await Connection.db.authenticate()

    if (config.db.sync) {
      logger.info(
        `Database: models: 
        ${Connection.entities.map(a => a.name).join(', ')}`,
      )
      await Connection.db.sync({ alter: config.db.alter, force: config.db.force })
      logger.info('Database: Connected')
    }
    return true
  } catch (e: unknown) {
    const msg = (e as Error)?.message
    logger.error('Unable to connect to the database:', e)
    if (msg?.includes('does not exist')) {
      const result = await createDatabase()
      return result
    }
    if (msg?.includes('column')) {
      const result = await checkMigrations()
      return result
    }
  }
  return false
}

export default Connection
