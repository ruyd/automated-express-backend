import { DataTypes } from 'sequelize'
import { addModel } from '../../db'
import { Order, OrderItem } from '..'

export const OrderModel = addModel<Order>({
  name: 'order',
  attributes: {
    orderId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
    },
    status: {
      type: DataTypes.STRING,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
})

export const OrderItemModel = addModel<OrderItem>({
  name: 'orderItem',
  attributes: {
    orderItemId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    orderId: {
      type: DataTypes.UUID,
    },
    drawingId: {
      type: DataTypes.UUID,
    },
    productId: {
      type: DataTypes.STRING,
    },
    priceId: {
      type: DataTypes.STRING,
    },
    paid: {
      type: DataTypes.DECIMAL(10, 2),
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    tokens: {
      type: DataTypes.INTEGER,
    },
    type: {
      type: DataTypes.STRING,
    },
  },
})
