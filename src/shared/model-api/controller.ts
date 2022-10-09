import { FindOptions, Model, ModelStatic } from 'sequelize/types'
import { MakeNullishOptional } from 'sequelize/types/utils'
import { PagedResult } from '../types'
import { HttpNotFoundError } from '../errorHandler'
import logger from '../logger'

export async function list<T extends {}>(
  model: ModelStatic<Model<T>>,
  options: FindOptions = { limit: 100, offset: 0 },
): Promise<PagedResult<T>> {
  const { count: total, rows } = await model.findAndCountAll({
    raw: true,
    nest: true,
    include: Object.keys(model.associations),
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

export async function getIfExists<T extends {}>(
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
  payload: T,
): Promise<T> {
  const casted = payload as unknown as MakeNullishOptional<T>
  try {
    const [item] = await model.upsert(casted)
    return item.get()
  } catch (e: unknown) {
    const err = e as Error
    logger.error(`${model.name}.createOrUpdate(): ${err.message}`, err)
    throw new Error(err.message)
  }
}

export async function deleteIfExists<T extends {}>(
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
    return false
  }
}
