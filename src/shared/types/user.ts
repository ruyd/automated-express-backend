import { Entity } from '.'

export interface UserPreferences {
  [key: string]: unknown
}

export interface User extends Entity {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  picture?: string
  banned?: boolean
  status?: number
  preferences?: UserPreferences
  loginCount?: number
  lastLogin?: Date
  roles?: string[]
}

export interface Address extends Entity {
  addressId: string
  userId: string
  name: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  default?: boolean
}

export interface PaymentMethod extends Entity {
  paymentMethodId: string
  userId: string
  name: string
  type: string
  last4: string
  expMonth: number
  expYear: number
  default?: boolean
}

export interface UserActive {
  socketId: string
  userId: string
  ip?: string
  userAgent?: string
}
