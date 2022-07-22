export * from './models'
export * from './user'
export * from './user'
import { JwtPayload } from 'jsonwebtoken'

export interface AppAccessToken extends JwtPayload {
  userId: string
  roles: string[]
}

export interface Entity {
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
