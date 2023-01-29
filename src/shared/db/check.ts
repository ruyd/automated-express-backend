import config from '../config'
import logger from '../logger'
import Connection, { createDatabase } from '.'
import { checkMigrations } from './migrator'

export async function checkDatabase(syncOverride?: boolean): Promise<boolean> {
  if (!Connection.initialized) {
    logger.error('DB Connection not initialized')
    return false
  }

  const syncModels = syncOverride ? syncOverride : config.db.sync

  try {
    logger.info('Connecting to database...')
    config.db.models = Connection.entities.map(m => m.name)
    await Connection.db.authenticate()
    logger.info(
      `Database: models: 
        ${Connection.entities.map(a => a.name).join(', ')}`,
    )
    if (syncModels) {
      await Connection.db.sync({ alter: config.db.alter, force: config.db.force })
    }
    logger.info('Database: Connected')
    return true
  } catch (e: unknown) {
    const msg = (e as Error)?.message
    logger.error('Unable to connect to the database:', e)
    if (msg?.includes('does not exist')) {
      const result = await createDatabase()
      return result
    }
    if (msg?.includes('column')) {
      const result = await checkMigrations()
      return result
    }
  }
  return false
}
