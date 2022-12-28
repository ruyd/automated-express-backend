import express from 'express'
import { Model, ModelStatic, Order } from 'sequelize/types'
import Connection, { EntityConfig } from '../db'
import { EnrichedRequest } from '../types'
import { createOrUpdate, getIfExists, gridPatch, gridDelete, list } from './controller'
import logger from '../logger'

export interface modelApiConfig {
  userIdColumn: string
  getAuthUserId(req: express.Request): string
}

export const modelApiConfig: modelApiConfig = {
  userIdColumn: 'userId',
  getAuthUserId: req => (req as EnrichedRequest).auth?.userId,
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
  res: express.Response,
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
  res: express.Response,
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
        ${item[modelApiConfig.userIdColumn]}`,
      )
    }
  }
  return instance
}

export async function deleteHandler(
  this: ModelStatic<Model>,
  req: express.Request,
  res: express.Response,
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
  res: express.Response,
) {
  if (!this) {
    throw new Error('this is not defined')
  }
  const where: Record<string, string> = {}
  const order: Order = []
  const model = this as ModelStatic<Model>
  const fields = model.getAttributes()
  //filter by query params 1-1 to model attributes
  for (const field in req.query) {
    if (fields[field]) {
      where[field] = req.query[field] as string
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
  //userId filtering from authentication token
  const authId = modelApiConfig.getAuthUserId(req)
  if (authId && Object.keys(fields).includes(modelApiConfig.userIdColumn)) {
    where[modelApiConfig.userIdColumn] = authId
  }
  const limit = Number(req.query.limit || 100)
  const offset = Number(req.query.offset || 0)
  const result = await list(model, { where, limit, offset, order })
  res.json(result)
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
    const prefix = model.name.toLowerCase()
    router.get(`/${prefix}`, listHandler.bind(model))
    router.get(`/${prefix}/:id`, getHandler.bind(model))
    router.post(`/${prefix}`, saveHandler.bind(model))
    router.delete(`/${prefix}/:id`, deleteHandler.bind(model))
    router.patch(`/${prefix}`, gridPatchHandler.bind(model))
    router.delete(`/${prefix}`, gridDeleteHandler.bind(model))
  }
}
