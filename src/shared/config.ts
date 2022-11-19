import dotenv from 'dotenv'
import { OAS3Definition } from 'swagger-jsdoc'
import packageJson from '../../package.json'
import sequelizeConfig from '../../setup/db.json'

dotenv.config({})

const env = process.env || {}

export interface Config {
  trace: boolean
  production: boolean
  port: number
  jsonLimit: string
  db: {
    name: string
    url: string
    schema: string
    ssl: boolean
    force: boolean
    alter: boolean
  }
  auth: {
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

//rework with secrets
const { database, host, username, password, ssl, schema } = sequelizeConfig.development
const DB_URL = env.DB_URL || `postgres://${username}:${password}@${host}/${database}`
const port = Number(env.PORT || 3001)
const config: Config = {
  trace: false,
  production: env.NODE_ENV === 'production',
  port,
  jsonLimit: env.JSON_LIMIT || '1mb',
  db: {
    force: false,
    alter: false,
    name: database,
    url: DB_URL,
    schema,
    ssl,
  },
  auth: {
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

export function getClientConfig() {
  return {
    auth: {
      domain: config.auth.domain,
      baseUrl: config.auth.baseUrl,
      audience: config.auth.clientAudience,
      clientId: config.auth.clientId,
      redirectUrl: config.auth.redirectUrl,
    },
  }
}

export default config
