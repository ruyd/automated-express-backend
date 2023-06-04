import { config } from './shared/config'
import express from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import { prepareSwagger } from './shared/model-api/swagger'
import { registerModelApiRoutes } from './shared/model-api/routes'
import { errorHandler } from './shared/errorHandler'
import cors from 'cors'
import api from './routes'
import { activateAxiosTrace, endpointTracingMiddleware, printRouteSummary } from './shared/trace'
import { Connection } from './shared/db'
import { checkDatabase } from './shared/db/check'
import { modelAuthMiddleware } from './shared/auth'
import { homepage } from './shared/server'

export interface BackendApp extends express.Express {
  onStartupCompletePromise: Promise<boolean[]>
}

export interface BackendOptions {
  checks?: boolean
  trace?: boolean
}

export function createBackendApp({ checks, trace }: BackendOptions = { checks: true }): BackendApp {
  const app = express() as BackendApp

  if (trace !== undefined) {
    config.trace = trace
    config.db.trace = trace
  }

  if (!config.production && config.trace) {
    activateAxiosTrace()
  }

  // Startup
  Connection.init()
  const promises = [checks ? checkDatabase() : Promise.resolve(true)]

  // Add Middlewares
  app.use(cors())
  app.use(express.json({ limit: config.jsonLimit }))
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  )
  app.use(endpointTracingMiddleware)
  app.use(modelAuthMiddleware)

  // Add Routes
  registerModelApiRoutes(Connection.entities, api)
  app.use(api)

  const swaggerDoc = prepareSwagger(app, Connection.entities)
  app.use(
    config.swaggerSetup.basePath,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, {
      customSiteTitle: config.swaggerSetup.info?.title,
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  )

  app.onStartupCompletePromise = Promise.all(promises)

  printRouteSummary(app)

  app.get('/', homepage)

  app.use(errorHandler)

  return app
}

export default createBackendApp
