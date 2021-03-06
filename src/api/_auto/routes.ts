import express from 'express'
import { Model, ModelStatic, Order } from 'sequelize/types'
import { entities, ModelConfig } from '../../shared/db'
import { getAuthWare, ReqWithAuth } from '../../shared/auth'
import { createOrUpdate, getIfExists, list } from './controller'

export interface AutoApiConfig {
  userIdColumn: string
  getAuthUserId(req: express.Request): string
}

export const autoApiConfig: AutoApiConfig = {
  userIdColumn: 'userId',
  getAuthUserId: (req) => (req as ReqWithAuth).auth?.userId,
}

/**
 * Saves payload via upsert with userIdColumn set to auth.id
 * @param req
 * @param res
 * @returns
 */
export async function saveHandler(
  this: typeof Model,
  req: express.Request,
  res: express.Response
) {
  if (!this) {
    throw new Error('this is not defined')
  }
  if (!req.body) {
    return res.status(400).send('Request body is missing')
  }
  const model = this as ModelStatic<Model>
  const authId = autoApiConfig.getAuthUserId(req)
  if (
    authId &&
    Object.keys(model.getAttributes()).includes(autoApiConfig.userIdColumn) &&
    !req.body[autoApiConfig.userIdColumn]
  ) {
    req.body[autoApiConfig.userIdColumn] = authId
  }
  const result = await createOrUpdate(model, req.body)
  res.json(result)
}

export async function getUserRelatedRecord(
  r: express.Request,
  model: ModelStatic<Model>
) {
  const req = r as ReqWithAuth
  const authId = autoApiConfig.getAuthUserId(req)
  const instance = await getIfExists(model, req.params.id)
  if (
    authId &&
    Object.keys(model.getAttributes()).includes(autoApiConfig.userIdColumn)
  ) {
    const roles = req.config?.roles || []
    const hasRole = roles ? roles?.every((r) => roles.includes(r)) : false
    const item = instance.get()
    if (authId !== item[autoApiConfig.userIdColumn] && !hasRole) {
      throw new Error('Unauthorized access of another user data')
    } else {
      console.warn(
        `user accesing another user ${model.tableName} ${authId} != 
        ${item[autoApiConfig.userIdColumn]}`
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

export async function getHandler(
  this: typeof Model,
  req: express.Request,
  res: express.Response
) {
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
 * Import and modify static autoApiConfig to customize
 * @param req
 * @param res
 */
export async function listHandler(
  this: typeof Model,
  req: express.Request,
  res: express.Response
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
  const authId = autoApiConfig.getAuthUserId(req)
  if (authId && Object.keys(fields).includes(autoApiConfig.userIdColumn)) {
    where[autoApiConfig.userIdColumn] = authId
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
 * @param authMiddleware - token check middleware
 **/
export function autoApiRouter(
  models: ModelStatic<Model>[],
  router: express.Router
): void {
  for (const model of models) {
    const cfg = entities.find((m) => m.name === model.name) as ModelConfig
    const authCheck = getAuthWare(cfg).authWare
    const unsecure: express.Handler = (_r, _p, n) => n()
    const readCheck = cfg.unsecure || cfg.unsecureRead ? unsecure : authCheck
    const writeCheck = cfg.unsecure ? unsecure : authCheck

    const prefix = model.name.toLowerCase()
    router.get(`/${prefix}`, readCheck, listHandler.bind(model))
    router.get(`/${prefix}/:id`, readCheck, getHandler.bind(model))
    router.post(`/${prefix}`, writeCheck, saveHandler.bind(model))
    router.delete(`/${prefix}/:id`, writeCheck, deleteHandler.bind(model))
  }
}
