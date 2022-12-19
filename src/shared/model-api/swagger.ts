import { Model, ModelStatic } from 'sequelize/types'
import { OAS3Definition, Schema } from 'swagger-jsdoc'
import { EntityConfig } from '../db'

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

export function applyModelsToSwaggerDoc(entities: EntityConfig[], swaggerDoc: OAS3Definition) {
  autoCompleteResponses(swaggerDoc)
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
