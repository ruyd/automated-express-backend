import { v1 } from '@google-cloud/secret-manager'
import logger from './logger'

export async function getSecrets() {
  logger.info(`Getting secrets from Secret Manager...`)
  const result = {} as { [key: string]: string }
  const client = new v1.SecretManagerServiceClient({
    projectId: process.env.GCP_PROJECT_ID,
  })
  const asyncList = client.listSecretsAsync()
  try {
    for await (const secret of asyncList) {
      const name = secret.name as string
      if (!name) {
        logger.error(`Secret name is missing`)
        continue
      }
      const [details] = await client.accessSecretVersion({ name: `${name}/versions/latest` })
      const data = details.payload?.data
      if (!data) {
        logger.warn(`Secret ${name} has no payload`)
        continue
      }
      // Never log secret values, only names
      logger.info(`Loaded secret: ${name}`)
      result[name] = data.toString()
    }
  } catch (error) {
    logger.error(`Error getting secrets: ${error}`)
  }
  return result
}
