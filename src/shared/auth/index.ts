import axios, { AxiosResponse } from 'axios'
import express from 'express'
import { expressjwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { AppAccessToken, EnrichedRequest } from '../types'
import { Connection, EntityConfig } from '../db'
import logger from '../logger'
import { HttpUnauthorizedError } from '../errorHandler'

export interface oAuthError {
  error?: string
  error_description?: string
  status?: number
}

export interface oAuthResponse extends oAuthError {
  access_token: string
  id_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface oAuthRegistered extends oAuthError {
  _id: string
  email: string
  family_name: string
  given_name: string
  email_verified: boolean
}

let jwkClient: jwksRsa.JwksClient
export function getJwkClient() {
  if (!jwkClient) {
    jwkClient = jwksRsa({
      jwksUri: `${config.auth?.baseUrl}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    })
  }
  return jwkClient
}

let jwtVerify: (req: express.Request, res: express.Response, next: express.NextFunction) => void
export function getJwtVerify() {
  if (!jwtVerify) {
    jwtVerify = expressjwt({
      secret: config.auth.tokenSecret || 'off',
      algorithms: ['HS256'],
    })
  }
  return jwtVerify
}

export type ModelWare = {
  config: EntityConfig
  authWare: express.Handler
}

const readMethods = ['GET', 'HEAD', 'OPTIONS']
const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function checkToken(header: jwt.JwtHeader | undefined, token: string | undefined) {
  let accessToken: AppAccessToken | undefined
  const hasAuthProvider = config.auth.baseUrl && config.auth.clientId && config.auth.clientSecret
  if (hasAuthProvider && header?.alg === 'RS256' && header && token) {
    const result = await getJwkClient().getSigningKey(header.kid)
    const key = result.getPublicKey()
    accessToken = jwt.verify(token, key, {
      algorithms: ['RS256'],
    }) as AppAccessToken
  } else if (token) {
    accessToken = jwt.verify(token, config.auth.tokenSecret as string) as AppAccessToken
  }
  return accessToken
}

export async function tokenCheckWare(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  try {
    const { header, token } = setRequest(req)
    if (config.auth.offline) {
      return next()
    }
    const accessToken = await checkToken(header, token)
    if (!accessToken) {
      throw Error('Not logged in')
    }
    return next()
  } catch (err) {
    logger.error(err)
    const error = err as Error
    throw new HttpUnauthorizedError(error.message)
  }
}
export async function modelAuthMiddleware(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  try {
    const entity = Connection.entities.find(e => e.name === req.originalUrl.replace('/', ''))
    const { header, token } = setRequest(req, entity)
    if (config.auth.offline) {
      return next()
    }
    if (
      (entity?.publicRead && readMethods.includes(req.method)) ||
      (entity?.publicWrite && writeMethods.includes(req.method))
    ) {
      return next()
    }
    // If not public, we need a token
    const accessToken = await checkToken(header, token)
    if (entity && !accessToken) {
      throw Error('Not logged in')
    }
    // Valid, but let's heck if user has access role
    if (
      entity &&
      accessToken &&
      entity.roles?.length &&
      !entity.roles?.every(r => accessToken?.roles.includes(r))
    ) {
      throw Error('Needs user access role for request')
    }
    // All good
    return next()
  } catch (err) {
    logger.error(err)
    const error = err as Error
    throw new HttpUnauthorizedError(error.message)
  }
}

export function setRequest(
  r: express.Request,
  cfg?: EntityConfig,
): {
  header?: jwt.JwtHeader
  token?: string
} {
  const req = r as EnrichedRequest
  req.config = cfg

  if (!req.headers.authorization?.includes('Bearer ')) {
    return {}
  }
  const token = req.headers.authorization.split(' ')[1]
  const headerChunk = token.split('.')[0]
  const decoded = Buffer.from(headerChunk, 'base64').toString()
  if (!decoded.includes('{')) {
    return {}
  }
  req.auth = decodeToken(token) as AppAccessToken
  const header = JSON.parse(decoded) as jwt.JwtHeader
  return { header, token }
}

/**
 * HS256 token encoding
 * Not for auth0 or any providers without private key
 * @param obj
 * @returns
 */
export function createToken(obj: object): string {
  const token = jwt.sign(obj, config.auth.tokenSecret as string)
  return token
}

export function decodeToken(token: string) {
  if (!token) {
    return undefined
  }
  const authInfo = jwt.decode(token) as jwt.JwtPayload
  if (!authInfo) {
    return undefined
  }
  const prefix = config.auth?.ruleNamespace || 'https://'
  const keys = Object.keys(authInfo).filter(key => key.includes(prefix))
  for (const key of keys) {
    authInfo[key.replace(prefix, '')] = authInfo[key]
    delete authInfo[key]
  }
  return authInfo
}

export async function authProviderLogin(
  username: string,
  password: string,
): Promise<oAuthResponse> {
  const response = await axios.post(
    `${config.auth?.baseUrl}/oauth/token`,
    {
      client_id: config.auth?.clientId,
      client_secret: config.auth?.clientSecret,
      audience: `${config.auth?.baseUrl}/api/v2/`,
      grant_type: 'password',
      username,
      password,
    },
    {
      validateStatus: () => true,
    },
  )
  return response.data
}

export async function authProviderRegister(
  payload: Record<string, string>,
): Promise<Partial<oAuthRegistered>> {
  try {
    const response = await axios.post(`${config.auth?.baseUrl}/dbconnections/signup`, {
      connection: 'Username-Password-Authentication',
      client_id: config.auth?.clientId,
      email: payload.email,
      password: payload.password,
      user_metadata: {
        id: payload.userId,
      },
    })
    return response.data
  } catch (err: unknown) {
    const error = err as Error & {
      response: AxiosResponse
    }
    return {
      error: error.response?.data?.name,
      error_description: error.response?.data?.description,
    }
  }
}

export async function authProviderChangePassword(
  payload: Record<string, string>,
): Promise<oAuthError | string> {
  try {
    const response = await axios.post(`${config.auth?.baseUrl}/dbconnections/change_password`, {
      connection: 'Username-Password-Authentication',
      client_id: config.auth?.clientId,
      email: payload.email,
    })
    return response.data
  } catch (err: unknown) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.name,
      error_description: error.response?.data?.description,
    }
  }
}

export async function authProviderPatch(
  sub: string,
  payload: {
    connection: string
    user_metadata: Record<string, string>
    [key: string]: unknown
  },
): Promise<oAuthError | string> {
  try {
    const response = await axios.patch(
      `${config.auth?.baseUrl}/api/v2/users/${sub}`,
      {
        ...payload,
      },
      {
        headers: {
          Authorization: `Bearer ${config.auth?.manageToken}`,
        },
      },
    )
    return response.data
  } catch (err: unknown) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.error,
      error_description: error.response?.data?.message,
    }
  }
}

export async function lazyLoadManagementToken(): Promise<boolean> {
  if (!config.auth?.explorerId) {
    return false
  }

  if (config.auth?.manageToken) {
    const decoded = jwt.decode(config.auth?.manageToken) as jwt.JwtPayload
    if (decoded.exp && decoded.exp > Date.now() / 1000) {
      return true
    } else {
      logger.info('Management token expired')
      config.auth.manageToken = undefined
    }
  }

  logger.info('Getting management token...')
  const response = await axios.post(
    `${config.auth?.baseUrl}/oauth/token`,
    {
      client_id: config.auth.explorerId,
      client_secret: config.auth.explorerSecret,
      audience: config.auth.explorerAudience,
      grant_type: 'client_credentials',
    },
    {
      validateStatus: () => true,
    },
  )

  if (config.trace) {
    logger.info('response' + JSON.stringify(response.data))
  }

  if (response.data.access_token) {
    config.auth.manageToken = response.data.access_token
  }

  return true
}
