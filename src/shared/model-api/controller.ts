import { FindOptions, Model, ModelStatic } from 'sequelize/types'
import { MakeNullishOptional } from 'sequelize/types/utils'
import { PagedResult } from '../types'
import { GridPatchProps } from '../types'
import { HttpNotFoundError } from '../errorHandler'
import logger from '../logger'
import sequelize from 'sequelize'
import Connection from '../db'

export async function list<T extends object>(
  model: ModelStatic<Model<T>>,
  options: FindOptions = { limit: 100, offset: 0, include: [] },
): Promise<PagedResult<T>> {
  const { count: total, rows } = await model.findAndCountAll({
    nest: true,
    include: options.include || [],
    ...options,
  })

  return {
    items: rows as unknown as T[],
    offset: options.offset || 0,
    limit: options.limit || 100,
    hasMore: total > (options.offset || 0) + (options.limit || 100),
    total,
  }
}

export async function getIfExists<T extends object>(
  model: ModelStatic<Model<T>>,
  id: string,
): Promise<Model<T>> {
  const item = await model.findByPk(id)
  if (!item) {
    throw new HttpNotFoundError(`Record with id ${id} not found`)
  }
  return item
}

export async function createOrUpdate<T extends object>(
  model: ModelStatic<Model<T>>,
  payload: object,
): Promise<T> {
  const casted = payload as unknown as MakeNullishOptional<T>
  try {
    const [item] = await model.upsert(casted)
    const entity = Connection.entities.find(e => e.name === model.name)
    if (entity?.onChanges) {
      entity.onChanges(`${entity.name}`, item)
    }
    return item.get() as unknown as T
  } catch (e: unknown) {
    const err = e as Error
    logger.error(`${model.name}.createOrUpdate(): ${err.message}`, err)
    throw new Error(err.message)
  }
}

export async function deleteIfExists<T extends object>(
  model: ModelStatic<Model<T>>,
  id: string,
): Promise<boolean> {
  try {
    const item = await getIfExists(model, id)
    await item.destroy()
    return true
  } catch (e: unknown) {
    const err = e as Error
    logger.error(`${model.name}.deleteIfExists(): ${err.message}`, err)
    throw new Error(err.message)
  }
}

export async function gridPatch<T extends object>(
  model: ModelStatic<Model<T>>,
  payload: GridPatchProps,
): Promise<T> {
  try {
    const item = await getIfExists(model, payload.id as string)
    item.update({
      [payload.field]: payload.value,
    } as T)
    item.save()
    return item.get()
  } catch (e: unknown) {
    const err = e as Error
    logger.error(`${model.name}.gridPatch(): ${err.message}`, err)
    throw new Error(err.message)
  }
}

export async function gridDelete<T extends object>(
  model: ModelStatic<Model<T>>,
  payload: { ids: string[] },
): Promise<{ deleted: number }> {
  try {
    const deleted = await model.destroy({
      where: {
        [model.primaryKeyAttribute]: {
          [sequelize.Op.in]: payload.ids || [],
        },
      } as sequelize.WhereOptions<T>,
    })
    return { deleted }
  } catch (e: unknown) {
    const err = e as Error
    logger.error(`${model.name}.gridPatch(): ${err.message}`, err)
    throw new Error(err.message)
  }
}
