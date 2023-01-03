/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express'
import { Model, ModelStatic } from 'sequelize/types'
import swaggerJsdoc, { OAS3Definition, Schema } from 'swagger-jsdoc'
import config from '../config'
import Connection, { EntityConfig } from '../db'
import logger from '../logger'
import { getRoutesFromApp } from '../server'
import fs from 'fs'

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
}

export function getSchema(model: ModelStatic<Model>) {
  const excluded = ['createdAt', 'updatedAt', 'deletedAt']
  const columns = Object.entries(model.getAttributes()).filter(
    ([name]) => !excluded.includes(name),
  ) as [[string, { type: string; allowNull: boolean }]]
  const properties: { [key: string]: Schema } = {}
  for (const [name, attribute] of columns) {
    const type: string = conversions[attribute.type] || 'string'
    const definition: Schema = attribute.allowNull ? { type, required: true } : { type }
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
    const model = entity.model as ModelStatic<Model>
    const schema = getSchema(model)
    if (!swaggerDoc?.components?.schemas) {
      if (!swaggerDoc.components) {
        swaggerDoc.components = {}
      }
      swaggerDoc.components.schemas = {}
    }
    const existingSchema = swaggerDoc?.components?.schemas[model.name]
    if (!existingSchema) {
      swaggerDoc.components.schemas[model.name] = schema
    }
    if (!swaggerDoc.paths) {
      swaggerDoc.paths = {}
    }
    const paths = getPaths(model)
    for (const p in paths) {
      const existingPath = swaggerDoc.paths[p]
      if (!existingPath) {
        swaggerDoc.paths[p] = paths[p]
      }
    }
  }
}

export function applyRoutes(app: express.Application, swaggerDoc: OAS3Definition) {
  const paths = swaggerDoc.paths || {}
  const routes = getRoutesFromApp(app).filter(r => r.from === 'controller')
  for (const route of routes) {
    if (!paths[route.path]) paths[route.path] = {}
    const def = paths[route.path]
    for (const method of route.methods) {
      if (!def[method]) {
        def[method] = { summary: 'Detected' }
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

  if (config.trace) {
    logger.info('***** Swagger Paths *****')
    // eslint-disable-next-line no-console
    console.table(Object.keys(swaggerDoc?.paths || {}))
  }

  applyEntitiesToSwaggerDoc(entities, swaggerDoc)

  autoCompleteResponses(swaggerDoc)

  return swaggerDoc
}
