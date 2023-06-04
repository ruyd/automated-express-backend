import { Entity, Order, PaymentSource } from '.'

export const PlanIntervals = {
  Day: 'day',
  Week: 'week',
  Month: 'month',
  Year: 'year'
} as const

export type PlanInterval = typeof PlanIntervals[keyof typeof PlanIntervals]

export const PlanStatus = {
  Active: 'active',
  Expired: 'expired',
  Canceled: 'canceled'
} as const

export type PlanStatus = typeof PlanStatus[keyof typeof PlanStatus]

export interface SubscriptionPlan extends Entity {
  subscriptionPlanId: string
  name: string
  description?: string
  amount?: number
  interval?: PlanInterval
  intervalCount?: number
  trialPeriodDays?: number
  mappings: { [key in PaymentSource]?: { productId: string; enabled: boolean } }
  enabled?: boolean
}

export interface Subscription extends Entity {
  subscriptionId?: string
  userId?: string
  orderId?: string
  priceId?: string
  title?: string
  status?: PlanStatus
  canceledAt?: Date
  cancelationReason?: string
  order?: Order
}
