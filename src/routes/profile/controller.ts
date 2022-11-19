import express from 'express'
import {
  createToken,
  authProviderLogin,
  authProviderRegister,
  ReqWithAuth,
  authProviderChangePassword,
  lazyLoadManagementToken,
  authProviderPatch,
  decodeToken,
} from '../../shared/auth'
import { createOrUpdate } from '../../shared/model-api/controller'
import { UserModel } from '../../shared/types/user'
import { getPictureMock } from '../../shared/util'
import { AppAccessToken, IdentityToken } from '../../shared/types'
import { v4 as uuid } from 'uuid'
import { decode } from 'jsonwebtoken'
import logger from '../../shared/logger'

export async function register(req: express.Request, res: express.Response) {
  const payload = req.body
  if (!payload) {
    throw new Error('Missing payload')
  }

  const existing = await UserModel.findOne({ where: { email: payload.email } })
  if (existing) {
    throw new Error('Email already exists')
  }

  payload.userId = uuid()
  const providerResult = await authProviderRegister(payload)
  if (providerResult.error) {
    throw new Error(providerResult.error_description)
  }

  setPictureIfEmpty(payload)
  const user = await createOrUpdate(UserModel, payload)
  const token = createToken(user)
  res.json({ token })
}

export async function login(req: express.Request, res: express.Response) {
  const { email, password } = req.body

  const response = await authProviderLogin(email, password)
  if (response.error) {
    throw new Error(response.error_description)
  }

  let user = (
    await UserModel.findOne({
      where: { email },
    })
  )?.get()

  if (!user) {
    const decoded = decode(response.access_token) as AppAccessToken
    user = await createOrUpdate(UserModel, { email, userId: decoded.userId })
  }

  if (!user) {
    throw new Error('Database User could not be get/put')
  }

  res.json({
    token: response.access_token,
    user,
  })
}

/**
 * Create Email DB record if it doesn't exist
 * Update profile metadata with userId
 * Reissue access_token with userId (or client?)
 * auth0-node.socialLogin() better?
 * @param req access_token, id_token
 */
export async function social(req: express.Request, res: express.Response) {
  logger.info('Social login', req.body)
  const { idToken, accessToken } = req.body
  //validate tocket instead of just decode?
  const access = decodeToken(accessToken)
  const decoded = decode(idToken) as IdentityToken
  const { email } = decoded

  let user = (
    await UserModel.findOne({
      where: { email },
    })
  )?.get()

  if (!user) {
    user = await createOrUpdate(UserModel, { email, userId: uuid() })
  }

  if (!user) {
    throw new Error('Database User could not be found or created')
  }

  if (!access.sub) {
    throw new Error('No sub in access token')
  }

  let renew = false
  if (access.userId !== user.userId) {
    logger.info('Updating metadata userId', access.userId, user.userId)
    await lazyLoadManagementToken()
    const response = await authProviderPatch(access.sub, {
      connection: 'google-oauth2',
      user_metadata: {
        id: user.userId,
      },
    })
    logger.info('success' + JSON.stringify(response))
    renew = true
  }

  res.json({
    user,
    token: accessToken,
    renew,
  })
}

export async function socialCheck(req: express.Request, res: express.Response) {
  logger.info('Social Email Check', req.body)
  const { token } = req.body
  const decoded = decode(token) as IdentityToken
  const { email } = decoded
  const user = (
    await UserModel.findOne({
      where: { email },
    })
  )?.get()
  res.json({
    userId: user?.userId,
  })
}

export async function forgot(req: express.Request, res: express.Response) {
  const payload = req.body
  if (!payload) {
    throw new Error('Missing payload')
  }

  const user = await UserModel.findOne({ where: { email: req.body.email } })
  if (user) {
    const message = await authProviderChangePassword(payload)
    res.json({ success: true, message })
  }
  res.json({ success: false, message: 'No record found' })
}

export async function edit(req: express.Request, res: express.Response) {
  const payload = req.body
  if (!payload) {
    throw new Error('Missing payload')
  }
  const auth = (req as ReqWithAuth).auth as AppAccessToken
  payload.userId = auth.userId
  const user = await createOrUpdate(UserModel, payload)
  res.json({ user })
}

export function setPictureIfEmpty(payload: Record<string, string>): void {
  if (!payload?.picture && payload.firstName && payload.lastName) {
    payload.picture = getPictureMock(payload)
  }
}
