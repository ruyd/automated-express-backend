import { DataTypes } from 'sequelize'
import { Drawing } from '..'
import { addModel } from '../../db'

export const DrawingModel = addModel<Drawing>('drawing', {
  drawingId: {
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
  sell: {
    type: DataTypes.BOOLEAN,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
})
