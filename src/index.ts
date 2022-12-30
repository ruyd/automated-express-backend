import express from 'express'
import { createServer } from 'http'
import { createServer as createServerHttps } from 'https'
import config, { canStart } from './shared/config'
import logger from './shared/logger'
import createBackendApp from './app'
import { registerSocket } from './shared/socket'
;(() => {
  if (!canStart()) {
    const m = 'No PORT specified: Shutting down - Environment variables undefined'
    logger.error(m)
    throw new Error(m)
  }

  const app = createBackendApp()
  const url = config.backendBaseUrl + config.swaggerSetup.basePath
  const title = config.swaggerSetup.info?.title

  // Homepage
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(`<html><title>${title}</title>
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

  // Start server
  const server = config.certFile ? createServerHttps(app) : createServer(app)
  registerSocket(server)

  server.listen(config.port, () =>
    logger.info(
      `**************************************************************************\n\
      ⚡️[${title}]: Server is running with SwaggerUI Admin at ${url}\n\
      **************************************************************************`,
    ),
  )
})()
