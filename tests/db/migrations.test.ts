// import { beforeAllHook } from 'tests/helpers'
import createBackendApp from '../../src/app'
const { checkMigrations } = jest.requireActual('../../src/shared/db/migrator')
const { Connection } = jest.requireActual(
  '../../src/shared/db',
) as typeof import('../../src/shared/db')
// not supposed to be needed, check if this is a bug

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
