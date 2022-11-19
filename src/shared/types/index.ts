export * from './models'
export * from './user'
import { JwtPayload } from 'jsonwebtoken'

export interface AppAccessToken extends JwtPayload {
  userId: string
  roles: string[]
}

export interface IdentityToken extends JwtPayload {
  picture?: string | undefined
  email: string
  name: string
  given_name: string
  family_name: string
}

export interface Entity {
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface PagedResult<T> {
  items: T[]
  offset: number
  limit: number
  hasMore: boolean
  total: number
}
