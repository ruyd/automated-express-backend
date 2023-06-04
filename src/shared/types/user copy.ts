import { Entity } from '.'

export const UserRoles = {
  ADMIN: 'admin',
  MANAGER: 'manager'
} as const

export type UserRoleType = typeof UserRoles[keyof typeof UserRoles]

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
  favorite?: boolean
}

export interface PaymentMethod extends Entity {
  paymentMethodId: string
  userId: string
  name: string
  type: string
  last4: string
  expMonth: number
  expYear: number
  favorite?: boolean
}

export interface UserActive {
  socketId: string
  userId: string
  ip?: string
  userAgent?: string
}
