import 'express-async-errors'
import config from './shared/config'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import db, { models } from './shared/db'
import api from './api'
import { errorHandler } from './shared/errors'
import { swaggerDocModelInject } from './api/_auto/swagger'
import { autoApiRouter } from './api/_auto/routes'
;(async () => {
  //Initialize Models
  await db.authenticate()
  await db.createSchema(config.db.schema, {})
  await db.sync({ alter: false, force: false })

  const app: Express = express()
  app.use(express.json({ limit: config.jsonLimit }))
  app.use(cors())

  //Auto Swagger
  const swaggerDoc = swaggerJsdoc({
    swaggerDefinition: config.swaggerSetup,
    apis: ['**/api/swagger.yaml', '**/api/**/index.*s'],
  })
  console.info('Parsed swagger', swaggerDoc)
  swaggerDocModelInject(models, swaggerDoc)
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  )

  //Auto CRUD
  autoApiRouter(models, api)

  //Apply API
  app.use(`/${config.prefix}`, api)

  //Errors
  app.use(errorHandler)

  //Start server
  app.get('/', (req: Request, res: Response) => {
    res.send(`<html><title>${config.swaggerSetup.info.title}</title>
    <body style="
      display: flex;
      align-items: center;
      justify-content: center;
    ">
    <div>
    ⚡️[server]: Backend is running on ${req.headers.host} with <a href="${config.swaggerSetup.basePath}">SwaggerUI Admin at ${config.swaggerSetup.basePath}</a>
    </div>
    </body></html>`)
  })

  app.listen(config.port, () => {
    console.log(
      `⚡️[server]: Server is running at port ${config.port} with SwaggerUI Admin at ${config.swaggerSetup.basePath}`
    )
  })
})()
