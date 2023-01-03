import express from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { EntityConfig } from '../db'
import { Cart } from './cart'
export * from './models'
export * from './cart'
export * from './drawing'
export * from './order'
export * from './setting'
export * from './user'

export interface Jwt {
  [key: string]: unknown
  iss?: string | undefined
  sub?: string | undefined
  aud?: string | string[] | undefined
  exp?: number | undefined
  nbf?: number | undefined
  iat?: number | undefined
  jti?: string | undefined
}

export interface AppAccessToken extends JwtPayload {
  userId: string
  roles: string[]
}

export interface IdentityToken extends Jwt {
  picture?: string | undefined
  email: string
  name: string
  given_name: string
  family_name: string
}

/**
 * Common Model Options
 * ie: Timestamps
 */
export interface Entity {
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface PagedResult<T = { [key: string]: string | number }> {
  items: T[]
  offset: number
  limit: number
  hasMore: boolean
  total: number
}

export interface GridPatchProps {
  id: string | number
  field: string
  value: unknown
}

export interface CheckoutRequest {
  items: Cart[]
  intent?: string
  confirmation?: string
  shippingAddressId?: string
  paymentMethodId?: string
}

export type EnrichedRequest = express.Request & {
  auth: AppAccessToken
  config?: EntityConfig
}
