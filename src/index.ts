import express from 'express'
import config from './shared/config'
import logger from './shared/logger'
import { checkDatabase } from './shared/db'
import createBackendApp from './app'
;(async () => {
  await checkDatabase()

  const app = createBackendApp()

  const url =
    (process.env.BASEURL || `http://localhost:${config.port}`) + config.swaggerSetup.basePath

  //Start server
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(`<html><title>${config.swaggerSetup.info?.title}</title>
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

  app.listen(config.port, () =>
    logger.info(
      `⚡️[server]: Server is running at port ${config.port} with SwaggerUI Admin at ${url}\n`,
    ),
  )
})()
