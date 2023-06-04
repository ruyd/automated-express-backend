import { Entity } from '.'

export interface WalletTransaction extends Entity {
  transactionId?: string
  userId?: string
  amount?: number
  orderId?: string
}

export const WalletStatus = {
  Active: 'active',
  Flagged: 'flagged',
  Frozen: 'frozen',
  Closed: 'closed'
} as const

export type WalletStatus = typeof WalletStatus[keyof typeof WalletStatus]

export interface Wallet extends Entity {
  walletId?: string
  balance?: number
  currency?: string
  status?: WalletStatus
  transactions?: WalletTransaction[]
}
