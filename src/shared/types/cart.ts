import { Drawing } from './drawing'
import { Price, Product } from './product'

export const CartType = {
  PRODUCT: 'product',
  SUBSCRIPTION: 'subscription',
  DRAWING: 'drawing',
  TOKENS: 'tokens'
} as const

export type CartType = typeof CartType[keyof typeof CartType]

export interface Cart {
  cartId: string
  userId: string
  quantity: number
  cartType?: CartType
  drawingId?: string
  productId?: string
  priceId?: string
  drawing?: Drawing
  product?: Partial<Product & Price>
}
