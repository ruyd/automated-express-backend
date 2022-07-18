import { FindOptions, Model, ModelStatic } from 'sequelize/types'
import { MakeNullishOptional } from 'sequelize/types/utils'
import { HttpNotFoundError } from '../../shared/errors'

export async function list<T>(
  model: ModelStatic<Model<T>>,
  options: FindOptions = { limit: 100, offset: 0 }
): Promise<T[]> {
  const items = (await model.findAll({
    raw: true,
    nest: true,
    include: Object.keys(model.associations),
    ...options,
  })) as unknown as T[]
  return items
}

export async function getIfExists<T>(
  model: ModelStatic<Model<T>>,
  id: string
): Promise<Model<T>> {
  const item = await model.findByPk(id)
  if (!item) {
    throw new HttpNotFoundError(`Record with id ${id} not found`)
  }
  return item
}

export async function createOrUpdate<T extends object>(
  model: ModelStatic<Model<T>>,
  payload: T
): Promise<T> {
  const casted = payload as unknown as MakeNullishOptional<T>
  const [item] = await model.upsert(casted)
  return item.get()
}

export async function deleteIfExists<T>(
  model: ModelStatic<Model<T>>,
  id: string
): Promise<T> {
  const item = await getIfExists(model, id)
  await item.destroy()
  return item.get()
}
