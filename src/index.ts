import 'express-async-errors'
import config from './shared/config'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import db from './shared/db'
import api, { autoApiModels } from './api'
import { errorHandler } from './shared/errors'
import { swaggerDocModelInject } from './api/_auto/swagger'
;(async () => {
  //Initialize Models
  await db.authenticate()
  await db.createSchema(config.db.schema, {})
  await db.sync()

  const app: Express = express()
  app.use(express.json({ limit: '1mb' }))
  app.use(cors())

  //Swagger
  const swaggerDoc = swaggerJsdoc({
    swaggerDefinition: config.swaggerSetup,
    apis: ['./src/**/swagger.yaml', './src/**/routes.ts'],
  })

  swaggerDocModelInject(autoApiModels, swaggerDoc)

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  )

  //Apply API
  app.use(`/${config.version}`, api)

  //Errors
  app.use(errorHandler)

  //Start server
  app.get('/', (req: Request, res: Response) => {
    res.send('Starter Backend x')
  })

  app.listen(config.port, () => {
    console.log(
      `⚡️[server]: Server is running at https://localhost:${config.port} with SwaggerUI Admin at ${config.swaggerSetup.basePath}`
    )
  })
})()
