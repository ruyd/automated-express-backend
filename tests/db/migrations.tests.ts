import { beforeAllHook } from 'tests/helpers'
import createBackendApp from '../../src/app'
import { checkMigrations, Connection } from '../../src/shared/db'

beforeAll(() => beforeAllHook())
afterAll(() => {
  Connection.db.close()
})
describe('database migrations', () => {
  const app = createBackendApp({ checks: true, trace: false })
  test('startup', async () => {
    const checks = await app.onStartupCompletePromise
    expect(checks[0]).toBeTruthy()
  })

  test('migrate', async () => {
    const result = await checkMigrations()
    expect(result).toBeTruthy()
  })
})
