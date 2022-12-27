import os from 'os'
import { OAS3Definition } from 'swagger-jsdoc'
import packageJson from '../../package.json'
import appConfig from '../../config/app.json'
import logger from './logger'
import dotenv from 'dotenv'

const env = process['env']

export interface Config {
  isLocalhost: boolean
  trace: boolean
  production: boolean
  hostname?: string
  port?: number
  protocol: string
  backendBaseUrl: Readonly<string>
  jsonLimit: string
  certFile?: string
  certKeyFile?: string
  cors: {
    origin: string
  }
  db: {
    trace: boolean
    name: string
    url: string
    host: string
    schema: string
    ssl: boolean
    sync: boolean
    force: boolean
    alter: boolean
    models: string[]
  }
  auth: {
    offline: boolean
    sync: boolean
    trace: boolean
    tokenSecret?: string
    tenant: string
    domain: string
    baseUrl: string
    redirectUrl: string
    explorerAudience: string
    explorerId: string
    explorerSecret: string
    ruleNamespace: string
    algorithm: 'RS256' | 'HS256'
    clientAudience: string
    clientId?: string
    clientSecret?: string
    manageToken?: string
  }
  swaggerSetup: Partial<OAS3Definition>
}

export function parseDatabaseConfig(
  production: boolean,
  db: { url: string | null; ssl: boolean; schema: string },
) {
  if (!production) {
    return db
  }
  if (!db.url) {
    throw new Error('DB_URL is not set')
  }
  const url = envi(db.url) as string
  const database = url.slice(url.lastIndexOf('/') + 1)
  const username = url.slice(url.indexOf('//') + 2, url.indexOf(':'))
  const password = url.slice(url.indexOf(':') + 1, url.indexOf('@'))
  const host = url.slice(url.indexOf('@') + 1, url.lastIndexOf(':'))
  const dialect = url.slice(0, url.indexOf(':'))
  return {
    database,
    host,
    username,
    password,
    dialect,
    ssl: db.ssl,
    schema: db.schema,
  } as Record<string, unknown>
}

export function getConfig(): Config {
  dotenv.config({})

  const production = env.NODE_ENV === 'production'
  const serviceConfig = production ? appConfig.production : appConfig.development
  const { database, host, username, password, ssl, schema, dialect } = parseDatabaseConfig(
    production,
    serviceConfig.db,
  )
  const databaseUrl = `${dialect}://${username}:${password}@${host}/${database}`
  const DB_URL = env.DB_URL || databaseUrl
  const osHost = os.hostname()
  const isLocalhost = osHost.includes('local')
  const port = Number(env.PORT) || Number(envi(serviceConfig.service.port))
  const hostname = envi(serviceConfig.service.host) as string
  const protocol = envi(serviceConfig.service.protocol) as string

  return {
    trace: true,
    production,
    isLocalhost,
    hostname,
    protocol,
    backendBaseUrl: `${protocol}://${hostname}:${port}`,
    certFile: env.SSL_CRT_FILE,
    certKeyFile: env.SSL_KEY_FILE,
    port,
    jsonLimit: env.JSON_LIMIT || '1mb',
    cors: {
      origin: env.CORS_ORIGIN || '*',
    },
    db: {
      trace: true,
      sync: true,
      force: false,
      alter: true,
      name: database as string,
      host: host as string,
      url: DB_URL as string,
      schema: schema as string,
      ssl: env.DB_SSL === 'true' || (ssl as boolean),
      models: [],
    },
    auth: {
      offline: true,
      sync: true,
      trace: false,
      tokenSecret: env.TOKEN_SECRET || 'blank',
      tenant: env.AUTH_TENANT || 'Set AUTH_TENANT in .env',
      domain: `${env.AUTH_TENANT}.auth0.com`,
      baseUrl: `https://${env.AUTH_TENANT}.auth0.com`,
      redirectUrl: env.AUTH_REDIRECT_URL || 'http://localhost:3000/callback',
      explorerAudience: `https://${env.AUTH_TENANT}.auth0.com/api/v2/`,
      explorerId: env.AUTH_EXPLORER_ID || '',
      explorerSecret: env.AUTH_EXPLORER_SECRET || '',
      clientAudience: env.AUTH_AUDIENCE || 'https://backend',
      clientId: env.AUTH_CLIENT_ID || '',
      clientSecret: env.AUTH_CLIENT_SECRET || '',
      ruleNamespace: 'https://',
      algorithm: 'RS256',
    },
    swaggerSetup: {
      openapi: '3.0.0',
      info: {
        title: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
      },
      servers: [
        {
          url: `/`,
        },
      ],
      basePath: '/docs',
    },
  }
}

/**
 * Public config object for clients
 * @DevNotes Don't use Connection here since
 * it's a dependency of this file, circular error
 */
export function getClientConfig() {
  return {
    auth: {
      domain: config.auth.domain,
      baseUrl: config.auth.baseUrl,
      audience: config.auth.clientAudience,
      clientId: config.auth.clientId,
      redirectUrl: config.auth.redirectUrl,
    },
    admin: {
      models: config.db.models,
    },
  }
}

export function getLimitedEnv() {
  return appConfig.envConcerns.reduce((acc: { [key: string]: unknown }, key: string) => {
    acc[key] = env[key]
    return acc
  }, {})
}

export function envi(val: unknown): unknown {
  return typeof val === 'string' && val.startsWith('$') ? env[val.slice(1)] : val
}

export function canStart() {
  logger.info(`****** READYNESS CHECK *******`)
  // logger.info(`env.PORT: ${env.PORT} ⚡️`)
  const p = config.port
  const d = config.db.url
  const result = !!p
  logger.info(`PRODUCTION: ${config.production}`)
  logger.info(`URL: ${config.backendBaseUrl}`)
  logger.info(`${p ? '✅' : '❌'} PORT: ${p ? p : 'ERROR - Missing'}`)
  logger.info(
    `${d ? '✅' : '❌'} DB: ${d ? `${config.db.name}@${config.db.host}` : 'ERROR - Missing'}`,
  )
  logger.info(`**: ${result ? 'READY!' : 'HALT'}`)
  return result
}
export class Backend {
  static config: Config = {} as Config
  static canStart = false
  static init() {
    Backend.config = getConfig()
    Backend.canStart = canStart()
  }
}
export const config: Config = getConfig()
export default config
