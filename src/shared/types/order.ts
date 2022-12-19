import { Entity } from '.'
import { User } from './user'
import { Drawing } from './drawing'

export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export interface OrderItem extends Entity {
  orderItemId?: string
  orderId?: string
  drawingId?: string
  price?: number
  quantity?: number
  drawing?: Drawing
}

export interface Order extends Entity {
  orderId?: string
  userId?: string
  billingAddressId?: string
  shippingAddressId?: string
  paymentMethodId?: string
  total?: number
  status?: OrderStatus
  OrderItems?: OrderItem[]
  user?: User
}

export interface Payment extends Entity {
  paymentId: string
  userId: string
  orderId: string
  amount: number
  currency: string
  status?: string
}

export enum PaymentSource {
  Stripe = 'STRIPE',
  PayPal = 'PAYPAL',
}

export enum PaymentStatus {
  Successful = 'COMPLETED',
  Pending = 'PENDING',
  Failed = 'FAILED',
  Created = 'CREATED',
}

export const StripeToPaymentStatusMap = {
  canceled: PaymentStatus.Failed,
  succeeded: PaymentStatus.Successful,
  processing: PaymentStatus.Pending,
  requires_action: PaymentStatus.Pending,
  requires_capture: PaymentStatus.Pending,
  requires_confirmation: PaymentStatus.Pending,
  requires_payment_method: PaymentStatus.Pending,
  unknown: PaymentStatus.Failed,
}

export interface Subscription extends Entity {
  subscriptionId: string
  userId: string
  orderId: string
  amount: number
  currency: string
  status?: string
}
