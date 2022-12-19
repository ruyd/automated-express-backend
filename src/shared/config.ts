import os from 'os'
import { OAS3Definition } from 'swagger-jsdoc'
import packageJson from '../../package.json'
import appConfig from '../../config/app.json'
import logger from './logger'
import dotenv from 'dotenv'

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

export function getConfig(): Config {
  dotenv.config({})

  //TODO: add secrets vault inject to process.env
  const production = process.env.NODE_ENV === 'production'
  const serviceConfig = production ? appConfig.production : appConfig.development
  const { database, host, username, password, ssl, schema, dialect } = serviceConfig.db as Record<
    string,
    unknown
  >
  const devConnection = `${dialect}://${username}:${password}@${host}/${database}`
  const DB_URL = production ? process.env.DB_URL || process.env.DATABASE_URL : devConnection // covers ENV=test
  const osHost = os.hostname()
  const isLocalhost = osHost.includes('local')
  logger.info(`process.env.PORT: ${process.env.PORT} ⚡️`)
  const port = Number(process.env.PORT) || Number(envi(serviceConfig.service.port))
  const hostname = envi(serviceConfig.service.host) as string
  const protocol = envi(serviceConfig.service.protocol) as string

  return {
    trace: true,
    production,
    isLocalhost,
    hostname,
    protocol,
    backendBaseUrl: `${protocol}://${hostname}:${port}`,
    certFile: process.env.SSL_CRT_FILE,
    certKeyFile: process.env.SSL_KEY_FILE,
    port,
    jsonLimit: process.env.JSON_LIMIT || '1mb',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
    },
    db: {
      trace: true,
      sync: true,
      force: false,
      alter: true,
      name: database as string,
      url: DB_URL as string,
      schema: schema as string,
      ssl: process.env.DB_SSL === 'true' || (ssl as boolean),
      models: [],
    },
    auth: {
      offline: true,
      sync: true,
      trace: false,
      tokenSecret: process.env.TOKEN_SECRET || 'blank',
      tenant: process.env.AUTH_TENANT || 'Set AUTH_TENANT in .env',
      domain: `${process.env.AUTH_TENANT}.auth0.com`,
      baseUrl: `https://${process.env.AUTH_TENANT}.auth0.com`,
      redirectUrl: process.env.AUTH_REDIRECT_URL || 'http://localhost:3000/callback',
      explorerAudience: `https://${process.env.AUTH_TENANT}.auth0.com/api/v2/`,
      explorerId: process.env.AUTH_EXPLORER_ID || '',
      explorerSecret: process.env.AUTH_EXPLORER_SECRET || '',
      clientAudience: process.env.AUTH_AUDIENCE || 'https://backend',
      clientId: process.env.AUTH_CLIENT_ID || '',
      clientSecret: process.env.AUTH_CLIENT_SECRET || '',
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
    acc[key] = process.env[key]
    return acc
  }, {})
}

export function envi(val: unknown): unknown {
  return typeof val === 'string' && val.startsWith('$') ? process.env[val.slice(1)] : val
}

export function canStart() {
  logger.info(`****** READYNESS CHECK *******`)
  logger.info(JSON.stringify(getLimitedEnv()))
  const p = config.production ? process.env.PORT : config.port
  const d = config.production ? process.env.DB_URL || process.env.DATABASE_URL : config.db.url
  const result = !!p && !!d
  logger.info(`PRODUCTION: ${config.production}`)
  logger.info(`URL: ${config.backendBaseUrl}`)
  logger.info(`${p ? '✅' : '❌'} PORT: ${p ? p : 'ERROR - Missing'}`)
  logger.info(`${d ? '✅' : '❌'} DB: ${d ? /[^/]*$/.exec(config.db.url) : 'ERROR - Missing'}`)
  logger.info(`**: ${result ? 'READY!' : 'HALT'}`)
  return result
}
export const config: Config = getConfig()
export default config
export class Backend {
  static config: Config = {} as Config
  static canStart = false
  static init() {
    Backend.config = getConfig()
    Backend.canStart = canStart()
  }
}
