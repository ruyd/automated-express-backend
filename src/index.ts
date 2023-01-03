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
  return server
})()
