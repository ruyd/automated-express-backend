import { checkDatabase, Connection } from '../../src/shared/db'

describe('integrity check', () => {
  test('sync', async () => {
    Connection.init()
    const seq = await checkDatabase()
    expect(seq).toBeTruthy()

    // If data loss is no big deal, we can use sync() to update schema automatically
    // sequelize.sync({ force: true, match: /_test$/ });
  })
  afterAll(async () => {
    await Connection.db.close()
  })
})
