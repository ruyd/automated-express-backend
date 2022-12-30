import axios from 'axios'
import { lazyLoadManagementToken } from '.'
import { config } from '../config'
import logger from '../logger'

const readOptions = () => ({
  headers: {
    Authorization: `Bearer ${config.auth.manageToken || 'error not set'}`,
  },
  validateStatus: () => true,
})

const log = (s: string, o?: unknown) =>
  config.auth.trace
    ? logger.info(`AUTH0-SYNC::${s}: ${o ? JSON.stringify(o, null, 2) : ''}`)
    : () => {
        /**/
      }
const get = <T>(url: string) => axios.get<T>(`${config.auth?.baseUrl}/api/v2/${url}`, readOptions())
const post = <T>(url: string, data: unknown) =>
  axios.post<T>(`${config.auth?.baseUrl}/api/v2/${url}`, data, readOptions())

/**
 * Auth0 can be tricky enough to merit, experimental automated setup
 * Check exists and if not found, create:
 * - Check for Resource Servers
 * - Check for Clients and sets clientId and clientSecret
 * - Check for Client Grants
 * - Check for Rules
 */
export async function authProviderAutoConfigure(): Promise<boolean> {
  logger.info('Auth0: Sync()')
  if (process.env.NODE_ENV === 'test') {
    logger.info('Auth0: Skipped for Tests')
    return true
  }
  if (!config.auth.sync) {
    logger.info('Auth0: Sync Off')
    return false
  }
  if (!config.auth.enabled) {
    logger.info('Auth0: Offline Mode')
    return false
  }
  if (!config.auth.tenant || !config.auth.explorerId || !config.auth.explorerSecret) {
    log('Auth0: explorer credentials not set - skipping sync')
    // eslint-disable-next-line no-console
    console.warn(
      '\x1b[33m*****************************\n\x1b[33m*** AUTH_TENANT AUTH_EXPLORER_ID AND AUTH_EXPLORER_SECRET ARE NOT SET - AUTH0 SYNC TURNED OFF ***\n\x1b[33m***************************** \x1b[0m',
    )
    return false
  }
  const success = await lazyLoadManagementToken()
  if (!success) {
    logger.warn('Failed to get auth0 management token - skipping')
    return false
  }
  if (!config.auth.manageToken) {
    logger.error('Auth0: management token not set - aborting sync')
    return false
  }
  await ensureResourceServers()
  await ensureClients()
  await ensureRules()
  if (config.auth.clientId) {
    log(
      `Auth0 Check Complete > AUTH_CLIENT_ID: ${config.auth.clientId} > For clients use GET /config`,
    )
  }
  return true
}

async function ensureClients() {
  interface AuthClient {
    id: string
    name: string
    is_system: boolean
    identifier: string
    scopes: string[]
    client_id: string
    client_secret: string
    [key: string]: unknown
  }

  interface Grant {
    id: string
    client_id: string
    audience: string
    scope: string[]
  }

  const clientClient = {
    name: 'client',
    allowed_clients: [],
    allowed_logout_urls: [],
    callbacks: [
      'http://localhost:3000',
      'http://localhost:3000/callback',
      'http://localhost:3001',
      'https://accounts.google.com/gsi/client',
    ],
    native_social_login: {
      apple: {
        enabled: false,
      },
      facebook: {
        enabled: false,
      },
    },
    allowed_origins: ['http://localhost:3000'],
    client_aliases: [],
    token_endpoint_auth_method: 'client_secret_post',
    app_type: 'regular_web',
    grant_types: [
      'authorization_code',
      'implicit',
      'refresh_token',
      'client_credentials',
      'password',
      'http://auth0.com/oauth/grant-type/password-realm',
      'http://auth0.com/oauth/grant-type/passwordless/otp',
      'http://auth0.com/oauth/grant-type/mfa-oob',
      'http://auth0.com/oauth/grant-type/mfa-otp',
      'http://auth0.com/oauth/grant-type/mfa-recovery-code',
    ],
    web_origins: ['http://localhost:3000'],
    custom_login_page_on: true,
  }

  const backendClient = {
    name: 'backend',
    token_endpoint_auth_method: 'client_secret_post',
    app_type: 'non_interactive',
    grant_types: ['client_credentials'],
    custom_login_page_on: true,
  }

  const grants = (await get<Grant[]>('client-grants'))?.data
  const grant = async (client: AuthClient, audience: string) => {
    log(`Creating client grant for ${client.name}`)
    const grantResult = await post<Grant>(`client-grants`, {
      client_id: client.client_id,
      audience,
      scope: [],
    })
    if (grantResult.data?.id) {
      log(`Created client grant`, grantResult.data)
      grants.push(grantResult.data)
    } else {
      logger.error(
        `Failed to create client grant for ${client.name}` + JSON.stringify(grantResult.data),
      )
    }
  }

  const addClient = async (client: Partial<AuthClient>, audience: string) => {
    log('Creating client', { client, audience })
    const result = await post<AuthClient>(`clients`, client)
    if (!result.data?.client_id) {
      logger.error(`Failed to create client ${client.name}` + JSON.stringify(result.data))
    }
    log(`Created client ${client.name}`, result.data)
    await grant(result.data, audience)
    return result.data
  }

  const existing = await get<AuthClient[]>(`clients`)
  const authManager = existing.data.find(c => c.name === 'API Explorer Application')
  let existingBackend = existing.data.find(e => e.name === 'backend')
  if (!existingBackend) {
    existingBackend = await addClient(backendClient, config.auth.explorerAudience)
  }
  let existingClient = existing.data.find(e => e.name === 'client')
  if (!existingClient) {
    existingClient = await addClient(clientClient, config.auth.clientAudience)
  }

  // backend has manager
  // client has backend
  if (
    existingBackend &&
    authManager?.identifier &&
    !grants.find(
      g => g.client_id === existingBackend?.client_id && g.audience === authManager.identifier,
    )
  ) {
    await grant(existingBackend, authManager?.identifier)
  }

  if (
    existingClient &&
    !grants.find(
      g => g.client_id === existingClient?.client_id && g.audience === config.auth.clientAudience,
    )
  ) {
    grant(existingClient, config.auth.clientAudience)
  }

  if (!config.auth.clientId && existingClient) {
    log(`Setting config.auth.clientId to ${existingClient.client_id}`)
    config.auth.clientId = existingClient.client_id
    config.auth.clientSecret = existingClient.client_secret
  } else {
    log(`Auth.clientId already set to ${config.auth.clientId}`, config.auth)
  }
}

async function ensureResourceServers() {
  const resourceServers = [
    {
      name: 'backend',
      identifier: config.auth.clientAudience,
    },
  ]

  interface ResourceServer {
    id: string
    name: string
    is_system: boolean
    identifier: string
    scopes: string[]
  }

  const existing = await get<ResourceServer[]>(`resource-servers`)
  const missing = resourceServers.filter(
    rs => !existing.data.find(e => e.identifier === rs.identifier),
  )
  if (missing.length) {
    log(`Creating missing resource servers: ${missing.map(m => m.name).join(', ')}`)
    for (const rs of missing) {
      const result = await post<ResourceServer>(`resource-servers`, rs)
      log(`Created resource server ${rs.name} with id ${result.data.id}`)
    }
  }
}

async function ensureRules() {
  const rules = [
    {
      name: 'enrichToken',
      script:
        'function enrichToken(user, context, callback) {\n' +
        '  let accessTokenClaims = context.accessToken || {};\n' +
        '  const assignedRoles = (context.authorization || {}).roles;\n' +
        '  accessTokenClaims[`https://roles`] = assignedRoles;\n' +
        '  user.user_metadata = user.user_metadata || {};\n' +
        '  if (!user.user_metadata.id && context.request.query.app_user_id) {\n' +
        '    user.user_metadata.id = context.request.query.app_user_id;\n' +
        '  }\n' +
        '  accessTokenClaims[`https://userId`] = user.user_metadata.id;\n' +
        '  accessTokenClaims[`https://verified`] = user.email_verified;\n' +
        '  context.accessToken = accessTokenClaims;\n' +
        '  return callback(null, user, context);\n' +
        '}',
      order: 1,
      enabled: true,
    },
  ]

  interface Rule {
    id: string
    name: string
    script: string
    order: number
    enabled: boolean
    stage: string
  }

  const existing = await get<Rule[]>(`rules`)
  const missing = rules.filter(rule => !existing.data.find(erule => erule.name === rule.name))
  if (missing.length) {
    log('Missing rules, creating... ' + JSON.stringify(missing))
    for (const rule of missing) {
      const result = await post<Rule>(`rules`, rule)
      log('Result: ' + JSON.stringify(result.data))
    }
  }
}
