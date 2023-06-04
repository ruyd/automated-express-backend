import express from 'express'
import { Model, ModelStatic } from 'sequelize'
import swaggerJsdoc, { OAS3Definition, Schema } from 'swagger-jsdoc'
import config from '../config'
import Connection, { EntityConfig } from '../db'
import { getRoutesFromApp } from '../server'
import fs from 'fs'
import logger from '../logger'

const conversions: Record<string, string> = {
  INTEGER: 'number',
  BIGINT: 'number',
  FLOAT: 'number',
  DOUBLE: 'number',
  DECIMAL: 'number',
  NUMERIC: 'number',
  REAL: 'number',
  DATE: 'string',
  DATETIME: 'string',
  TIMESTAMP: 'string',
  TIME: 'string',
  CHAR: 'string',
  BOOLEAN: 'boolean',
} as const

const getConversion = (type: string): { type: string; items?: { type: string } } => {
  if (type.endsWith('[]')) {
    const arrayType = type.slice(0, type.indexOf('('))
    return { type: 'array', items: { type: conversions[arrayType] || 'string' } }
  }
  const keys = Object.keys(conversions)
  const key = keys.find(key => type.startsWith(key))
  return {
    type: key ? conversions[key] : 'string',
  }
}

export function getSchema(model: ModelStatic<Model>) {
  const excluded = ['createdAt', 'updatedAt', 'deletedAt']
  const obj = model.name === 'model' ? {} : model.getAttributes()
  const columns = Object.entries(obj).filter(([name]) => !excluded.includes(name)) as [
    [string, { type: string; allowNull: boolean }],
  ]
  const properties: { [key: string]: Schema } = {}
  for (const [name, attribute] of columns) {
    const { type, items } = getConversion(attribute.type.toString())
    const definition: Schema = { type, required: !!attribute.allowNull, items }
    properties[name] = definition
  }
  return {
    type: 'object',
    properties,
  }
}

export function getPaths(model: typeof Model) {
  const tagName = model.name.toLowerCase()
  const tags = [tagName]
  const $ref = `#/components/schemas/${model.name}`
  const paths = {
    [`/${tagName}`]: {
      get: {
        summary: 'Get list',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'include',
            in: 'query',
          },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref,
                  },
                },
              },
            },
          },
        },
        tags,
      },
      post: {
        summary: 'Create or update an item',
        required: true,
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref,
              },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  $ref,
                },
              },
            },
          },
        },
        tags,
      },
    },
    [`/${tagName}/{id}`]: {
      get: {
        summary: 'Get one',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'ID of the item to retrieve',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  $ref,
                },
              },
            },
          },
        },
        tags,
      },
      delete: {
        summary: 'Delete one',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'ID of the item to delete',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  success: { type: 'boolean' },
                },
              },
            },
          },
        },
        tags,
      },
    },
  }
  return paths
}

export function autoCompleteResponses(swaggerDoc: OAS3Definition) {
  for (const path in swaggerDoc.paths) {
    const def = swaggerDoc.paths[path]
    for (const method in def) {
      if (!def[method]) {
        def[method] = { summary: 'No summary' }
      }
      if (!def[method].responses) {
        def[method].responses = { 200: swaggerDoc.components?.responses?.Success }
      }
    }
  }
}

export function applyEntitiesToSwaggerDoc(entities: EntityConfig[], swaggerDoc: OAS3Definition) {
  if (!Connection.initialized) {
    return
  }
  for (const entity of entities) {
    const schema = getSchema(entity.model as ModelStatic<Model>)
    if (!swaggerDoc?.components?.schemas) {
      if (!swaggerDoc.components) {
        swaggerDoc.components = {}
      }
      swaggerDoc.components.schemas = {}
    }
    const existingSchema = swaggerDoc?.components?.schemas[entity.name]
    if (!existingSchema) {
      swaggerDoc.components.schemas[entity.name] = schema
    }
    if (!swaggerDoc.paths) {
      swaggerDoc.paths = {}
    }
    const paths = getPaths(entity.model as ModelStatic<Model>)
    for (const p in paths) {
      const existingPath = swaggerDoc.paths[p]
      if (!existingPath) {
        swaggerDoc.paths[p] = paths[p]
      }
    }

    // join auto tables, move to function
    const autoTables =
      entity.joins
        ?.filter(a => typeof a.through === 'string')
        .map(join => join.through as string) ?? []
    for (const autoTable of autoTables) {
      const autoModel = Connection.db.models[autoTable]
      if (!autoModel) {
        logger.error(`Could not find auto model ${autoTable}`)
        continue
      }
      const schema = getSchema(autoModel)
      if (!swaggerDoc?.components?.schemas) {
        if (!swaggerDoc.components) {
          swaggerDoc.components = {}
        }
        swaggerDoc.components.schemas = {}
      }
      const existingSchema = swaggerDoc?.components?.schemas[autoModel.name]
      if (!existingSchema) {
        swaggerDoc.components.schemas[autoModel.name] = schema
      }
      if (!swaggerDoc.paths) {
        swaggerDoc.paths = {}
      }
      const paths = getPaths(autoModel)
      for (const p in paths) {
        const existingPath = swaggerDoc.paths[p]
        if (!existingPath) {
          swaggerDoc.paths[p] = paths[p]
        }
      }
    }
  }
}

export function getParameters(method: string, path: string) {
  const params = [...path.matchAll(/{\w+}/g)]
  const parameters = params.map(([name]) => ({
    name: name.replace(/[{}]/g, ''),
    in: 'path',
    schema: {
      type: 'string',
    },
  }))

  return ['post', 'put', 'patch', 'delete'].includes(method)
    ? {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        parameters,
      }
    : {
        parameters,
      }
}

export function applyRoutes(app: express.Application, swaggerDoc: OAS3Definition) {
  const paths = swaggerDoc.paths || {}

  const routes = getRoutesFromApp(app).filter(r => r.from === 'controller')
  for (const route of routes) {
    const rawPaths = Array.isArray(route.path) ? route.path : [route.path]
    const convertedPaths = rawPaths.map(p =>
      p.replace(/:\w+/g, (match: string) => `{${match.substring(1)}}`),
    )
    for (const path of convertedPaths) {
      if (!paths[path]) {
        paths[path] = {}
      }
      const def = paths[path]
      const tags = path.split('/')[1] ? [path.split('/')[1]] : []
      const security = [{ BearerAuth: [] }]
      for (const method of route.methods) {
        if (!def[method]) {
          def[method] = {
            ...getParameters(method, path),
            summary: 'Detected',
            tags,
            security,
          }
        }
      }
    }
  }
}

export function prepareSwagger(app: express.Application, entities: EntityConfig[]): OAS3Definition {
  const swaggerDev = swaggerJsdoc({
    swaggerDefinition: config.swaggerSetup as OAS3Definition,
    apis: ['**/*/swagger.yaml', '**/*/index.ts'],
  }) as OAS3Definition

  const swaggerProd = fs.existsSync('swagger.json')
    ? JSON.parse(fs.readFileSync('swagger.json', 'utf8'))
    : {}

  const swaggerDoc = { ...swaggerDev, ...swaggerProd }

  applyRoutes(app, swaggerDoc)

  applyEntitiesToSwaggerDoc(entities, swaggerDoc)

  autoCompleteResponses(swaggerDoc)

  return swaggerDoc
}
