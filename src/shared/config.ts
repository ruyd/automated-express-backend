import dotenv from 'dotenv'
import { OAS3Definition } from 'swagger-jsdoc'
import packageJson from '../../package.json'

dotenv.config({})

export interface Config {
  version: string
  port: number
  tokenSecret?: string
  db: {
    url: string
    schema: string
    ssl?: boolean
  }
  swaggerSetup: OAS3Definition
}

const apiVersion = 'v1'
const config: Config = {
  version: apiVersion,
  port: Number(process.env.PORT || 3001),
  tokenSecret: process.env.TOKEN_SECRET,
  db: {
    url: process.env.DB_URL || '',
    schema: process.env.DB_SCHEMA || 'public',
    ssl: process.env.DB_SSL === 'true',
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
        url: `http://localhost:${process.env.PORT}/${apiVersion}`,
        description: `localhost:${process.env.PORT}`,
      },
    ],
    basePath: '/docs',
  },
}

export default config
