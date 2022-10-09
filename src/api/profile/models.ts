import { DataTypes, Model } from 'sequelize'
import db, { commonOptions, register } from '../../shared/db'

export interface User {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  picture?: string
}

export const UserModel = register<User>('user', {
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
})

export const UserPublicAttributes = ['userId', 'firstName', 'lastName', 'email', 'picture']
