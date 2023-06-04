import os from 'os'
import { OAS3Definition } from 'swagger-jsdoc'
import packageJson from '../../../package.json'
import appConfig from './app.json'
import logger from '../logger'
import dotenv from 'dotenv'

// Anti-webpack sorcery
const env = process['env']

export interface DBUrl {
  dialect?: string
  username?: string
  password?: string
  host: string
  database: string
  ssl: boolean
  schema: string
}

export interface DBConfig extends DBUrl {
  trace: boolean
  url: string
  sync: boolean
  force: boolean
  alter: boolean
  models: string[]
}

export interface Config {
  isLocalhost: boolean
  trace: boolean
  production: boolean
  hostname?: string
  port?: number
  protocol: string
  backendBaseUrl: Readonly<string>
  jsonLimit: string
  sslKey?: string
  sslCert?: string
  cors: {
    origin: string
  }
  db: DBConfig
  auth: {
    enabled: boolean
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
    return db as unknown as DBUrl
  }
  const url = env.DB_URL || (envi(db.url) as string)
  if (!url) {
    logger.error('DB_URL is not set')
    return db as unknown as DBUrl
  }
  const database = url.slice(url.lastIndexOf('/') + 1)
  const regex = /(\w+):\/\/(\w+):(.*)@(.*):(\d+)\/(\w+)/
  const found = url.match(regex)
  const dialect = found?.[1] || 'postgres'
  const username = found?.[2] || ''
  const password = found?.[3] || ''
  const host = found?.[4] || ''
  return {
    database,
    host,
    username,
    password,
    dialect,
    ssl: db.ssl,
    schema: db.schema,
  } as DBUrl
}

export function getConfig(): Config {
  dotenv.config({})

  const production = !['development', 'test'].includes(env.NODE_ENV?.toLowerCase() || '')
  const serviceConfig = production ? appConfig.production : appConfig.development
  const { database, host, username, password, ssl, schema, dialect } = parseDatabaseConfig(
    production,
    serviceConfig.db,
  )

  const DB_URL = `${dialect}://${username}:${password}@${host}/${database}`
  const osHost = os.hostname()
  const isLocalhost = osHost.includes('local')
  const port = Number(env.PORT) || Number(envi(serviceConfig.service.port))
  const hostname = envi(serviceConfig.service.host) as string
  const protocol = envi(serviceConfig.service.protocol) as string
  const sslKey = envi(serviceConfig.service.sslKey) as string
  const sslCert = envi(serviceConfig.service.sslCert) as string

  return {
    trace: true,
    production,
    isLocalhost,
    hostname,
    protocol,
    backendBaseUrl: `${protocol}://${hostname}:${port}`,
    sslKey,
    sslCert,
    port,
    jsonLimit: env.JSON_LIMIT || '1mb',
    cors: {
      origin: env.CORS_ORIGIN || '*',
    },
    db: {
      trace: false,
      sync: true,
      force: false,
      alter: true,
      database,
      host: host as string,
      url: DB_URL as string,
      schema: schema as string,
      ssl: env.DB_SSL === 'true' || (ssl as boolean),
      models: [],
    },
    auth: {
      enabled: true,
      sync: true,
      trace: true,
      tokenSecret: env.TOKEN_SECRET || 'blank',
      redirectUrl: env.AUTH_REDIRECT_URL || 'http://localhost:3000/callback',
      tenant: env.AUTH_TENANT || '',
      domain: `${env.AUTH_TENANT}.auth0.com`,
      baseUrl: `https://${env.AUTH_TENANT}.auth0.com`,
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

export function envi(val: unknown): unknown {
  return typeof val === 'string' && val.startsWith('$') ? env[val.slice(1)] : val
}

export function canStart() {
  logger.info(`****** READYNESS CHECK *******`)
  const p = config.port
  const d = config.db.database
  const result = !!p
  logger.info(`PRODUCTION: ${config.production}`)
  logger.info(`URL: ${config.backendBaseUrl}`)
  logger.info(`${p ? '✅' : '❌'} PORT: ${p ? p : 'ERROR - Missing'}`)
  logger.info(
    `${d ? '✅' : '❌'} DB: ${d ? `${config.db.database}@${config.db.host}` : 'ERROR - Missing'}`,
  )
  logger.info(`**: ${result ? 'READY!' : 'HALT'}`)
  logger.info(`env.PORT: ${env.PORT} ⚡️`)
  return result
}

export const config: Config = getConfig()
export default config
