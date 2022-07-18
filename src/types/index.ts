import { JwtPayload } from 'jsonwebtoken'

export * from './drawing'
export * from './user'

export interface AppAccessToken extends JwtPayload {
  userId: string
  roles: string[]
}

export interface Entity {
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
