import express from 'express'
import {
  createToken,
  authProviderLogin,
  authProviderRegister,
  ReqWithAuth,
} from '../../shared/auth'
import { createOrUpdate } from '../_auto/controller'
import { UserModel } from '../../types/user'
import { AppAccessToken } from '../../types'
import { v4 as uuid } from 'uuid'
import { getPictureMock } from '../..//shared/util'

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

  const user = await UserModel.findOne({
    where: { email },
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
