import dotenv from 'dotenv'
import { OAS3Definition } from 'swagger-jsdoc'
import packageJson from '../../package.json'
import sequelizeConfig from '../../setup/db.json'

dotenv.config({})

export interface Config {
  production: boolean
  port: number
  tokenSecret?: string
  jsonLimit: string
  db: {
    name: string
    url: string
    schema: string
    ssl: boolean
    force: boolean
    alter: boolean
  }
  auth?: {
    baseUrl: string
    clientId: string
    clientSecret: string
    ruleNamespace: string
    algorithm: 'RS256' | 'HS256'
    manageToken?: string
  }
  swaggerSetup: Partial<OAS3Definition>
}

//rework with secrets
const { database, host, username, password, ssl, schema } = sequelizeConfig.development
const DB_URL = process.env.DB_URL || `postgres://${username}:${password}@${host}/${database}`
const port = Number(process.env.PORT || 3000)
const config: Config = {
  production: process.env.NODE_ENV === 'production',
  port,
  tokenSecret: process.env.TOKEN_SECRET,
  jsonLimit: process.env.JSON_LIMIT || '1mb',
  db: {
    force: false,
    alter: false,
    name: database,
    url: DB_URL,
    schema,
    ssl,
  },
  auth: {
    baseUrl: process.env.AUTH_BASE_URL || '',
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

export default config
