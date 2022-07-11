import { Model, DataTypes } from 'sequelize'
import db, { commonOptions } from '../../shared/db'

export interface Drawing {
  id?: string
  userId?: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export type DrawingInstance = Model<Drawing>

export const DrawingModel = db.define<DrawingInstance>(
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
  },
  {
    ...commonOptions,
  }
)
