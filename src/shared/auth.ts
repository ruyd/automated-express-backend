import axios, { AxiosResponse } from 'axios'
import express from 'express'
import { expressjwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import jwt, { JwtPayload } from 'jsonwebtoken'
import config from './config'

export interface AppAccessToken extends JwtPayload {
  userId: string
  roles: string[]
}
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

export type ReqWithAuth = express.Request & { auth: AppAccessToken }

const jwkClient = jwksRsa({
  jwksUri: `${config.auth?.baseUrl}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
})

const jwtVerify = expressjwt({
  secret: config.tokenSecret as string,
  algorithms: ['HS256'],
})

export async function tokenCheckWare(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  if (!config?.tokenSecret) {
    return next()
  }
  const { header, token } = setRequest(req as ReqWithAuth)
  if (config.auth?.algorithm === 'RS256' && header && token) {
    const result = await jwkClient.getSigningKey(header.kid)
    const key = result.getPublicKey()
    jwt.verify(token, key, { algorithms: ['RS256'] })
    return next()
  }

  return jwtVerify(req, _res, next)
}

export function hasRole(
  req: express.Request & { auth: { roles: string[] } },
  role: string
): boolean {
  return req.auth?.roles?.includes(role)
}

export function setRequest(req: ReqWithAuth): {
  header?: jwt.JwtHeader
  token?: string
} {
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
  const token = jwt.sign(obj, config.tokenSecret as string)
  return token
}

export function decodeToken(token: string) {
  const authInfo = jwt.decode(token) as jwt.JwtPayload
  const prefix = config.auth?.ruleNamespace || 'https://'
  const keys = Object.keys(authInfo).filter((key) => key.includes(prefix))
  for (const key of keys) {
    authInfo[key.replace(prefix, '')] = authInfo[key]
    delete authInfo[key]
  }
  return authInfo
}

export async function authProviderLogin(
  username: string,
  password: string
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
    }
  )
  return response.data
}

export async function authProviderRegister(
  payload: Record<string, string>
): Promise<Partial<oAuthRegistered | oAuthError>> {
  try {
    const response = await axios.post(
      `${config.auth?.baseUrl}/dbconnections/signup`,
      {
        connection: 'Username-Password-Authentication',
        client_id: config.auth?.clientId,
        email: payload.email,
        password: payload.password,
        user_metadata: {
          id: payload.userId,
        },
      }
    )
    return response.data
  } catch (err: unknown) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.name,
      error_description: error.response?.data?.description,
    }
  }
}

export async function authProviderChangePassword(
  payload: Record<string, string>
): Promise<oAuthError | string> {
  try {
    const response = await axios.post(
      `${config.auth?.baseUrl}/dbconnections/change_password`,
      {
        connection: 'Username-Password-Authentication',
        client_id: config.auth?.clientId,
        email: payload.email,
      }
    )
    return response.data
  } catch (err: unknown) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.name,
      error_description: error.response?.data?.description,
    }
  }
}

export async function authProviderPatch(payload: {
  id: string
  email: string
  password: string
}): Promise<oAuthError | string> {
  try {
    const response = await axios.patch(
      `${config.auth?.baseUrl}/api/v2/users/${payload.id}`,
      {
        connection: 'Username-Password-Authentication',
        client_id: config.auth?.clientId,
        ...payload,
      },
      {
        headers: {
          Authorization: `Bearer ${config.auth?.manageToken}`,
        },
      }
    )
    return response.data
  } catch (err: unknown) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.name,
      error_description: error.response?.data?.description,
    }
  }
}
