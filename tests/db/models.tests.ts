import { describe, expect, test } from '@jest/globals'
import { Connection, sortEntities } from 'src/shared/db'
import { ModelStatic, Model } from 'sequelize'
import { v4 as uuid } from 'uuid'
import createBackendApp from 'src/app'
import { createOrUpdate, deleteIfExists, getIfExists } from 'src/shared/model-api/controller'
import { beforeAllHook } from 'tests/helpers'
jest.mock('../../src/shared/socket')

const conversions: Record<string, string> = {
  INTEGER: 'number',
  BIGINT: 'snumber',
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

const excluded = ['createdAt', 'updatedAt', 'deletedAt', 'audienceIds']

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}

export function getMockValue(
  model: ModelStatic<Model>,
  mock: { [key: string]: unknown },
  columnName: string,
  columnType: string,
  randomize = false,
) {
  const type = conversions[columnType] || columnType
  const suffix = randomize ? Math.random() : ''
  const increment = randomize ? getRandomInt(1, 1000000) : 0
  const [, scale] = type.match(/\d+/g) || [10, 2]
  switch (type) {
    case 'UUID':
      return uuid()
    case 'TEXT':
    case type.match(/VARCHAR\(\w+\)/)?.input:
      return columnName + suffix
    case 'number':
      return 1 + increment
    case 'snumber':
      return 1 + increment + ''
    case type.match(/DECIMAL\(?.*\)?/)?.input:
      return (1 + increment).toFixed(scale as number) + ''
    case 'BOOLEAN':
      return true
    case 'date':
      return new Date().toISOString()
    case 'array':
      return [1, 2, 3]
    case 'JSONB':
    case 'JSON':
      return { test: 'test' }
    case 'VIRTUAL': {
      const column = model.getAttributes()[columnName]
      if (!column.get) return undefined
      const getter = column.get.bind(mock as unknown as Model)
      const bound = getter()
      return bound
    }
    default:
      // eslint-disable-next-line no-console
      console.log('getMockValue: unhandled type ' + columnType)
      return columnName
  }
}

export function getPopulatedModel(model: ModelStatic<Model>, cachedKeys: Record<string, unknown>) {
  console.log(cachedKeys)
  const columns = Object.entries(model.getAttributes()).filter(
    ([name]) => !excluded.includes(name),
  ) as [[string, { type: string; allowNull: boolean }]]
  const mock: { [key: string]: unknown } = {}
  for (const [name, attribute] of columns) {
    mock[name] = getMockValue(model, mock, name, attribute.type.toString())
    if (model.primaryKeyAttribute === name && !cachedKeys[name]) {
      cachedKeys[name] = mock[name]
    } else if (cachedKeys[name]) {
      mock[name] = cachedKeys[name]
    }
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

beforeAll(() => beforeAllHook())
afterAll(() => {
  Connection.db.close()
})
describe('Entity CRUD', () => {
  const app = createBackendApp({ checks: true, trace: false })
  test('startup', async () => {
    const checks = await app.onStartupCompletePromise
    expect(checks[0]).toBeTruthy()
  })

  console.log = jest.fn()

  const sorted = Connection.entities.sort(sortEntities)
  const mocks = {} as Record<string, { [key: string]: unknown }>
  const keys = {} as Record<string, string>
  for (const entity of sorted) {
    const model = entity.model
    if (!model) {
      throw new Error('No model found for ' + entity.name)
    }
    if (model.name === 'model') {
      throw new Error('Model init() not yet run' + entity.name)
    }
    const mock = getPopulatedModel(model, keys)
    console.log('Generated Mock Data for: ', model.name)
    mocks[model.name] = mock
    const primaryKeyId = mock[model.primaryKeyAttribute] as string
    test(`mock ${model.name}`, async () => {
      expect(primaryKeyId).toBeTruthy()
    })
  }

  console.log(
    'ready: ',
    sorted.map(e => e.name),
    keys,
    mocks,
  )

  for (const entity of sorted) {
    const model = entity.model as ModelStatic<Model>
    const mock = mocks[model.name]
    const primaryKeyId = mock[model.primaryKeyAttribute] as string
    if (!model) {
      throw new Error('No model found for ' + entity.name)
    }

    test(`create ${model.name}`, async () => {
      const result = await createOrUpdate(model, mock)
      console.log('create result', result)
      toMatchObjectExceptTimestamps(mock, result)
    })

    test(`read ${model.name}`, async () => {
      const item = await getIfExists(model, primaryKeyId)
      const result = item.get()
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
      const newValue = getMockValue(
        model,
        mock,
        propName,
        attributes[propName].type.toString({}),
        true,
      )
      const updatedMock = { ...mock, [propName]: newValue }
      const result = await createOrUpdate(model, updatedMock)
      toMatchObjectExceptTimestamps(updatedMock, result)
    })
  }

  //loop models in reverse order
  const reversed = [...sorted].reverse()
  for (const entity of reversed) {
    const model = entity.model as ModelStatic<Model>
    const mock = mocks[model.name]
    if (!mock) {
      throw new Error('mock not found')
    }
    test(`delete ${model.name}`, async () => {
      const result = await deleteIfExists(model, mock[model.primaryKeyAttribute] as string)
      expect(result).toBeTruthy()
    })
  }
})
