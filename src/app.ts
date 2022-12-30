import { config } from './shared/config'
import express from 'express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc, { OAS3Definition } from 'swagger-jsdoc'
import { applyModelsToSwaggerDoc } from './shared/model-api/swagger'
import { registerModelApiRoutes } from './shared/model-api/routes'
import { errorHandler } from './shared/errorHandler'
import cors from 'cors'
import api from './routes'
import { activateAxiosTrace, endpointTracingMiddleware } from './shared/logger'
import { authProviderAutoConfigure } from './shared/auth/sync'
import { checkDatabase, Connection } from './shared/db'
import { modelAuthMiddleware } from './shared/auth'
import { loadSettingsAsync } from './shared/settings'

export interface BackendApp extends express.Express {
  onStartupCompletePromise: Promise<boolean[]>
}

export function createBackendApp(): BackendApp {
  const app = express() as BackendApp

  if (!config.production && config.trace) {
    activateAxiosTrace()
  }

  // Startup
  Connection.init()
  const promises = [
    checkDatabase()
      .then(async ok => (ok ? await loadSettingsAsync() : ok))
      .then(async ok => (ok ? await authProviderAutoConfigure() : ok)),
  ]

  // Add Middlewares - Order is important
  app.use(errorHandler)
  app.use(cors())
  app.use(express.json({ limit: config.jsonLimit }))
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  )
  app.use(endpointTracingMiddleware)
  app.use(modelAuthMiddleware)

  // Swagger Portal
  const swaggerDoc = swaggerJsdoc({
    swaggerDefinition: config.swaggerSetup as OAS3Definition,
    apis: ['**/*/swagger.yaml', '**/routes/**/index.*s'],
  }) as OAS3Definition

  applyModelsToSwaggerDoc(Connection.entities, swaggerDoc)

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

  // Endpoints
  registerModelApiRoutes(Connection.entities, api)

  app.use(api)

  app.onStartupCompletePromise = Promise.all(promises)

  return app
}

export default createBackendApp
