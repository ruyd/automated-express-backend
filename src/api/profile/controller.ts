import express from 'express'
import {
  createToken,
  authProviderLogin,
  authProviderRegister,
  decodeToken,
} from '../../shared/auth'
import { createOrUpdate } from '../_auto/controller'
import { UserModel, UserPublicAttributes } from './models'
import { v4 as uuid } from 'uuid'
import { AppAccessToken } from '../../shared/auth'

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

  // const accessToken = decodeToken(response.access_token)
  // if (accessToken.verified) {
  // }

  const user = await UserModel.findOne({
    where: { email },
    attributes: UserPublicAttributes,
  })

  if (!user) {
    throw new Error('User not found')
  }

  res.json({
    token: response.access_token,
    user,
  })
}

export async function edit(req: express.Request, res: express.Response) {
  const payload = req.body
  if (!payload) {
    throw new Error('Missing payload')
  }
  const auth = (req as any).auth as AppAccessToken
  payload.userId = auth.userId
  const user = await createOrUpdate(UserModel, payload)
  res.json({ user })
}

export async function setPictureIfEmpty(payload: Record<string, string>) {
  if (!payload?.picture && payload.firstName && payload.lastName) {
    const f = payload.firstName.charAt(0).toLowerCase()
    const l = payload.lastName.charAt(0).toLowerCase()
    payload.picture = `https://i2.wp.com/cdn.auth0.com/avatars/${f}${l}.png?ssl=1`
  }
}
