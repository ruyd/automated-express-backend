import { DataTypes } from 'sequelize'
import { Drawing } from '@root/lib'
import { UserModel } from './user'
import { register } from '../shared/db'

export const DrawingModel = register<Drawing>(
  'drawing',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
    },
    name: {
      type: DataTypes.STRING,
    },
    history: {
      type: DataTypes.JSONB,
    },
    thumbnail: {
      type: DataTypes.TEXT,
    },
  },
  true
)

DrawingModel.hasOne(UserModel, {
  as: 'user',
  foreignKey: 'userId',
  sourceKey: 'userId',
})
