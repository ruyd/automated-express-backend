import { ClientConfig, Setting, SettingDataType } from './types'
import config from './config'
import Connection from './db'
import logger from './logger'
import { SettingModel } from './types'

/**
 * for .env to not break and avoid refactor to use config.settings
 * @param data
 */
function setConfigAuth(data: unknown) {
  const value = data as { [key: string]: string | boolean }
  const merged = {
    ...config.auth,
    ...value,
    enabled: value.enabled === true,
    sync: value.sync === true,
    domain: `${value.tenant}.auth0.com`,
    baseUrl: `https://${value.tenant}.auth0.com`,
    explorerAudience: `https://${value.tenant}.auth0.com/api/v2/`,
  }
  config.auth = merged
}

const setters: { [key: string]: (d: unknown) => void } = {
  auth0: setConfigAuth,
}

export async function loadSettingsAsync() {
  if (process.env.NODE_ENV === 'test') {
    logger.info(`Skipping settings load in test mode...`)
    return true
  }
  if (!Connection.initialized) {
    logger.info(`Skipping settings load, no connection...`)
    return false
  }
  logger.info(`Loading settings...`)

  const settings = (await SettingModel.findAll({ raw: true })) as unknown as Setting[]
  if (settings.length === 0) {
    config.settings = {}
  }
  for (const setting of settings) {
    logger.info(`Setting: ${setting.name}`)
    config.settings[setting.name] = setting.data as SettingDataType
    const setter = setters[setting.name]
    if (setter) {
      setter(setting.data)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const debug = config.settings
  return true
}
export async function getClientConfigSettings(isAdmin = false): Promise<ClientConfig> {
  await loadSettingsAsync() // stateless, add config for statefull, to skip stuff like this on VMs
  const admin =
    !config.production || isAdmin
      ? {
          models: config.db.models,
        }
      : undefined

  const settings = config.settings?.system
    ? {
        system: config.settings?.system,
        auth0: config.settings?.auth0,
        google: config.settings?.google,
      }
    : undefined

  const payload = {
    settings,
    admin,
    ready: !!config.settings?.system,
  }
  return payload as ClientConfig
}
