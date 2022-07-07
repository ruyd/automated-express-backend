import express from 'express'
import { createToken } from '../../shared/auth'
import config from '../../shared/config'
import { createOrUpdate } from '../_auto/controller'
import { UserModel } from './models'

export async function register(req: express.Request, res: express.Response) {
  const payload = req.body
  if (!payload) {
    throw new Error('Missing payload')
  }

  const existing = await UserModel.findOne({ where: { email: payload.email } })
  if (existing) {
    throw new Error('Email already exists')
  }

  const user = await createOrUpdate(UserModel, payload)
  const token = createToken(user)
  res.json({ token })
}

export async function login(req: express.Request, res: express.Response) {
  const { email, password } = req.body
  let user
  if (!user) {
    throw new Error('Invalid credentials')
  }

  if (!config.tokenSecret) {
    throw new Error('tokenSecret is not set')
  }

  const token = createToken(user)
  res.json({ token })
}

export async function edit(req: express.Request, res: express.Response) {
  const payload = req.body
  if (!payload) {
    throw new Error('Missing payload')
  }
  const user = await createOrUpdate(UserModel, payload)
  const token = createToken(user)
  res.json({ token })
}
