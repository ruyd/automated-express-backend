import { FindOptions, Model, ModelStatic } from 'sequelize/types'
import { HttpNotFoundError } from '../../shared/errors'

export async function list(
  model: ModelStatic<Model>,
  options: FindOptions = { limit: 100, offset: 0 }
): Promise<Record<string, unknown>[]> {
  const items = (await model.findAll({
    raw: true,
    ...options,
  })) as unknown as Record<string, unknown>[]
  return items
}

export async function getIfExists(
  model: ModelStatic<Model>,
  id: string
): Promise<Model> {
  const item = await model.findByPk(id)
  if (!item) {
    throw new HttpNotFoundError(`Record with id ${id} not found`)
  }
  return item
}

export async function createOrUpdate<T extends Model>(
  model: ModelStatic<Model>,
  payload: Record<string, unknown>
): Promise<T> {
  const [item] = await model.upsert(payload)
  return item.get()
}

export async function deleteIfExists(
  model: ModelStatic<Model>,
  id: string
): Promise<Record<string, unknown>> {
  const item = await getIfExists(model, id)
  await item.destroy()
  return item.get()
}
