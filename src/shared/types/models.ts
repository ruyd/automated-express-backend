import { DataTypes } from 'sequelize'
import { Drawing } from './drawing'
import { UserModel } from './user'
import { register } from '../db'

export const DrawingModel = register<Drawing>('drawing', {
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
  private: {
    type: DataTypes.BOOLEAN,
  },
})

DrawingModel.belongsTo(UserModel, {
  as: 'user',
  foreignKey: 'userId',
})
