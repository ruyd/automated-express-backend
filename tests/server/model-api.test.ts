import { describe, expect, test } from '@jest/globals'
import { checkDatabase, Connection } from '../../src/shared/db'
import createBackend from '../../src/app'
import { ModelStatic, Model } from 'sequelize'
import { v4 as uuid } from 'uuid'
import { createOrUpdate, deleteIfExists, getIfExists } from '../../src/shared/model-api/controller'

const conversions: Record<string, string> = {
  INTEGER: 'number',
  BIGINT: 'number',
  FLOAT: 'number',
  DOUBLE: 'number',
  DECIMAL: 'number',
  NUMERIC: 'number',
  REAL: 'number',
  DATE: 'date',
  DATETIME: 'date',
  TIMESTAMP: 'date',
  TIME: 'date',
  ['TIMESTAMP WITH TIME ZONE']: 'date',
}

const excluded = ['createdAt', 'updatedAt', 'deletedAt']

export function getMockValue(columnName: string, columnType: string, randomize = false) {
  const type = conversions[columnType] || columnType
  const suffix = randomize ? Math.random() : ''
  const increment = randomize ? Math.random() : 0
  switch (type) {
    case 'UUID':
      return uuid()
    case 'TEXT':
    case type.match(/VARCHAR\(\w+\)/)?.input:
      return columnName + suffix
    case 'number':
      return 1 + increment
    case 'BOOLEAN':
      return true
    case 'date':
      return new Date().toISOString()
    case 'array':
      return [1, 2, 3]
    case 'JSONB':
    case 'JSON':
      return { test: 'test' }
    default:
      // eslint-disable-next-line no-console
      console.log('getMockValue: unhandled type ' + columnType)
      return columnName
  }
}

export function getPopulatedModel(model: ModelStatic<Model>, keys: Record<string, unknown>) {
  console.log(keys)
  const columns = Object.entries(model.getAttributes()).filter(
    ([name]) => !excluded.includes(name),
  ) as [[string, { type: string; allowNull: boolean }]]
  const mock: { [key: string]: unknown } = {}
  for (const [name, attribute] of columns) {
    mock[name] = getMockValue(name, attribute.type.toString())
    if (model.primaryKeyAttribute === name && !keys[model.name]) {
      keys[model.name] = mock[name]
    }
  }
  for (const association in model.associations) {
    mock[model.associations[association].foreignKey] = keys[association]
  }
  return mock
}

export function toMatchObjectExceptTimestamps(
  expected: { [key: string]: unknown },
  actual: { [key: string]: unknown },
) {
  for (const key in expected) {
    if (!excluded.includes(key)) {
      expect(actual[key]).toEqual(expected[key])
    }
  }
}

describe('integrity check', () => {
  test('sync', async () => {
    const seq = await checkDatabase()
    expect(seq).toBeTruthy()

    // If data loss is no big deal, we can use sync() to update schema automatically
    // sequelize.sync({ force: true, match: /_test$/ });
  })
})

describe('model-api', () => {
  beforeAll(() => {
    createBackend()
  })

  const mocks = []
  const keys = {} as Record<string, string>
  for (const model of Connection.models) {
    const mock = getPopulatedModel(model, keys)
    console.info('Generated Data: ', model.name, mock)
    mocks.push(mock)
    const primaryKeyId = mock[model.primaryKeyAttribute] as string

    test(`mock ${model.name}`, async () => {
      expect(primaryKeyId).toBeTruthy()
    })

    test(`create ${model.name}`, async () => {
      const result = await createOrUpdate(model, mock)
      console.log('create result', result)
      toMatchObjectExceptTimestamps(mock, result)
    })

    test(`read ${model.name}`, async () => {
      const instance = await getIfExists(model, primaryKeyId)
      const result = instance.get()
      toMatchObjectExceptTimestamps(mock, result)
    })

    test(`update ${model.name}`, async () => {
      const foreignKeys = Object.keys(model.associations).map(
        key => model.associations[key].foreignKey,
      )
      const attributes = model.getAttributes()
      const propName = Object.keys(attributes).find(
        key => key !== model.primaryKeyAttribute && !foreignKeys.includes(key),
      )
      if (!propName) {
        console.error('No updateable properties found - skipping')
        return
      }
      const newValue = getMockValue(propName, attributes[propName].type.toString({}), true)
      const updatedMock = { ...mock, [propName]: newValue }
      const result = await createOrUpdate(model, updatedMock)
      toMatchObjectExceptTimestamps(updatedMock, result)
    })
  }

  //loop models in reverse order
  for (const model of Connection.models.reverse()) {
    const mock = mocks.pop()
    if (!mock) {
      throw new Error('mock not found')
    }
    test(`delete ${model.name}`, async () => {
      const result = await deleteIfExists(model, mock[model.primaryKeyAttribute] as string)
      expect(result).toBeTruthy()
    })
  }

  afterAll(async () => {
    await Connection.db.close()
  })
})
