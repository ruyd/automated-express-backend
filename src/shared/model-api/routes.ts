import express from 'express'
import { Model, ModelStatic, Op, Order } from 'sequelize'
import Connection, { EntityConfig } from '../db'
import { EnrichedRequest } from '../types'
import { createOrUpdate, getIfExists, gridPatch, gridDelete, list } from './controller'
import logger from '../logger'

export interface ModelApiConfig {
  userIdColumn: string
  getAuthUserId(req: express.Request): string
}

export const modelApiConfig: ModelApiConfig = {
  userIdColumn: 'userId',
  getAuthUserId: req => (req as EnrichedRequest).auth?.uid
}

/**
 * Saves payload via upsert with userIdColumn set to auth.id
 * @param req
 * @param res
 * @returns
 */
export async function saveHandler(this: typeof Model, req: express.Request, res: express.Response) {
  if (!this) {
    throw new Error('this is not defined')
  }
  if (!req.body) {
    res.status(400).send('Request body is missing')
  }
  const model = this as ModelStatic<Model>
  const authId = modelApiConfig.getAuthUserId(req)
  if (
    authId &&
    Object.keys(model.getAttributes()).includes(modelApiConfig.userIdColumn) &&
    !req.body[modelApiConfig.userIdColumn]
  ) {
    req.body[modelApiConfig.userIdColumn] = authId
  }
  const result = await createOrUpdate(model, req.body)
  res.json(result)
}

export async function gridPatchHandler(
  this: typeof Model,
  req: express.Request,
  res: express.Response
) {
  if (!this) {
    throw new Error('this is not defined')
  }
  if (!req.body) {
    res.status(400).send('Request body is missing')
  }
  const model = this as ModelStatic<Model>
  const authId = modelApiConfig.getAuthUserId(req)
  if (
    authId &&
    Object.keys(model.getAttributes()).includes(modelApiConfig.userIdColumn) &&
    !req.body[modelApiConfig.userIdColumn]
  ) {
    req.body[modelApiConfig.userIdColumn] = authId
  }
  const result = await gridPatch(model, req.body)
  res.json(result)
}

export async function gridDeleteHandler(
  this: ModelStatic<Model>,
  req: express.Request,
  res: express.Response
) {
  if (!this) {
    throw new Error('this is not defined')
  }
  const model = this as ModelStatic<Model>
  const result = await gridDelete(model, req.body)
  res.json(result)
}

export async function getUserRelatedRecord(r: express.Request, model: ModelStatic<Model>) {
  const req = r as EnrichedRequest
  const authId = modelApiConfig.getAuthUserId(req)
  const instance = await getIfExists(model, req.params.id)
  if (authId && Object.keys(model.getAttributes()).includes(modelApiConfig.userIdColumn)) {
    const roles = req.config?.roles || []
    const hasRole = roles ? roles?.every(r => roles.includes(r)) : false
    const item = instance.get()
    if (authId !== item[modelApiConfig.userIdColumn] && !hasRole) {
      throw new Error('Unauthorized access of another user data')
    } else {
      logger.warn(
        `user accesing another user ${model.tableName} ${authId} != 
        ${item[modelApiConfig.userIdColumn]}`
      )
    }
  }
  return instance
}

export async function deleteHandler(
  this: ModelStatic<Model>,
  req: express.Request,
  res: express.Response
) {
  if (!this) {
    throw new Error('this is not defined')
  }
  const model = this as ModelStatic<Model>
  const instance = await getUserRelatedRecord(req, model)
  instance.destroy()
  res.json({ success: true })
}

export async function getHandler(this: typeof Model, req: express.Request, res: express.Response) {
  if (!this) {
    throw new Error('this is not defined')
  }
  const model = this as ModelStatic<Model>
  const result = await getIfExists(model, req.params.id)
  res.json(result)
}

const operatorMap: Record<string, symbol> = {
  '!': Op.notLike,
  '%': Op.like,
  '>': Op.gt,
  '<': Op.lt,
  '[': Op.between
}

function checkForOperators(where: Record<string, string | object>, field: string, value: string) {
  if (value && Object.keys(operatorMap).some(o => value.includes(o))) {
    const operator = Object.keys(operatorMap).find(o => value.includes(o)) as string
    const val = operator !== '%' ? value.replace(operator, '') : value
    if (operator === '[') {
      const [from, to] = val.split(',')
      where[field] = { [operatorMap[operator]]: [from, to] }
    } else {
      where[field] = { [operatorMap[operator]]: val }
    }
  }
}

/**
 * Get Listing
 *
 * Auto detects and filters table based on request.auth.userId === table.userId
 * Import and modify static modelApiConfig to customize
 * @param req
 * @param res
 */
export async function listHandler(
  this: ModelStatic<Model>,
  req: express.Request,
  res: express.Response
) {
  if (!this) {
    throw new Error('this is not defined')
  }
  const where: Record<string, string | object> = {}
  const order: Order = []
  const model = this as ModelStatic<Model>
  const fields = model.getAttributes()
  //filter by query params 1-1 to model attributes
  for (const field in req.query) {
    if (fields[field]) {
      const value = req.query[field] as string
      where[field] = value
      checkForOperators(where, field, value)
    }
  }
  //sorting
  if (req.query.orderBy) {
    const sortFields = (req.query.orderBy as string)?.split(',')
    for (const field of sortFields) {
      const direction = field.startsWith('-') ? 'DESC' : 'ASC'
      order.push([field.replace(/^-{1}/, ''), direction])
    }
  }

  const include = req.query.include?.toString().split(',') || []

  //userId filtering from authentication token
  const authId = modelApiConfig.getAuthUserId(req)
  if (authId && Object.keys(fields).includes(modelApiConfig.userIdColumn)) {
    where[modelApiConfig.userIdColumn] = authId
  }
  const limit = Number(req.query.limit || 100)
  const offset = Number(req.query.offset || 0)
  const result = await list(model, { where, limit, offset, order, include })
  res.json(result)
}

function addRoutesForModel(router: express.Router, model: ModelStatic<Model>) {
  const prefix = model.name.toLowerCase()
  router.get(`/${prefix}`, listHandler.bind(model))
  router.get(`/${prefix}/:id`, getHandler.bind(model))
  router.post(`/${prefix}`, saveHandler.bind(model))
  router.delete(`/${prefix}/:id`, deleteHandler.bind(model))
  router.patch(`/${prefix}`, gridPatchHandler.bind(model))
  router.delete(`/${prefix}`, gridDeleteHandler.bind(model))
}

/**
 * Mounts the CRUD handlers for the given model using name as path,
 * ie: /v1/model.name/:id
 *
 * Might need options for any model to exclude certain methods/auth
 * @param models - array of sequelize models
 * @param router - express router
 **/
export function registerModelApiRoutes(entities: EntityConfig[], router: express.Router): void {
  if (!Connection.initialized) {
    return
  }
  for (const cfg of entities) {
    const model = cfg.model as ModelStatic<Model>
    if (model) {
      addRoutesForModel(router, model)
    }
  }

  const autoTables = entities
    .filter(e => e.joins?.find(j => typeof j.through === 'string'))
    .reduce((acc: Array<string>, entity) => {
      return [...acc, ...(entity.joins?.map(j => j.through as string) ?? [])]
    }, [])

  for (const table of autoTables) {
    const model = Connection.db?.models[table] as ModelStatic<Model>
    if (model) {
      addRoutesForModel(router, model)
    }
  }
}
