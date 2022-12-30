import { describe, expect, test, afterAll } from '@jest/globals'
import createBackendApp from 'src/app'
import { Connection } from '../../src/shared/db'

describe('integrity check', () => {
  const app = createBackendApp()
  test('sync', async () => {
    const results = await app.onStartupCompletePromise
    expect(results[0]).toBeTruthy()

    // If data loss is no big deal, we can use sync() to update schema automatically
    // sequelize.sync({ force: true, match: /_test$/ });
  })
  afterAll(() => {
    Connection.db.close()
  })
})
