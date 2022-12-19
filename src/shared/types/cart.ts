import { Drawing } from './drawing'

export interface Cart {
  cartId: string
  userId: string
  drawingId: string
  quantity: number
  drawing?: Drawing
}
