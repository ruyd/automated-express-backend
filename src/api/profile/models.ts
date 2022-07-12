import { DataTypes, Model } from 'sequelize'
import db, { commonOptions } from '../../shared/db'

export interface User {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  picture?: string
}

export type UserInstance = Model<User>

export const UserModel = db.define<UserInstance>(
  'user',
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    picture: {
      type: DataTypes.STRING,
    },
  },
  {
    ...commonOptions,
  }
)

export const UserPublicAttributes = [
  'userId',
  'firstName',
  'lastName',
  'email',
  'picture',
]
