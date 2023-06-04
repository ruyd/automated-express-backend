import express from 'express'
import { EntityConfig } from '../db'
import { Order } from './order'
import { Wallet } from './wallet'
import { AppAccessToken } from './auth'

export * from './cart'
export * from './drawing'
export * from './order'
export * from './setting'
export * from './user'
export * from './subscription'
export * from './product'
export * from './wallet'
export * from './auth'
export * from './item'
export * from './category'
export * from './models'

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
  ids: { cartId?: string; productId?: string; drawingId?: string }[]
  intent?: { amount: number; currency: string }
  confirmation?: string
  shippingAddressId?: string
  paymentSource?: string
}

export interface CheckoutResponse {
  order: Order
  error: string
  wallet?: Wallet
}

export type EnrichedRequest = express.Request & {
  auth: AppAccessToken
  config?: EntityConfig
}
