import { v1 } from '@google-cloud/secret-manager'
import logger from './logger'

export async function getSecrets() {
  logger.info(`Getting secrets from Secret Manager...`)
  const result = {} as { [key: string]: string }
  const client = new v1.SecretManagerServiceClient({
    projectId: 'mstream-368503',
  })
  const asyncList = client.listSecretsAsync()
  try {
    for await (const secret of asyncList) {
      const name = secret.name as string
      if (!name) {
        logger.error(`Secret name is missing`)
        continue
      }
      const [details] = await client.accessSecretVersion({ name })
      logger.info(`Secret: ${name} = ${JSON.stringify(details)}`)
      if (!details.payload?.data) {
        result[name] = details.payload?.data as string
      }
    }
  } catch (error) {
    logger.error(`Error getting secrets: ${error}`)
  }
  return result
}
