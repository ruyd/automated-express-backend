import { addModel } from '../../db'
import { DataTypes } from 'sequelize'
import { Drawing } from '..'

export const DrawingModel = addModel<Drawing>({
  name: 'drawing',
  attributes: {
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
  },
})
