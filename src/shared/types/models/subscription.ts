import { DataTypes } from 'sequelize'
import { addModel } from '../../db'
import { Subscription } from '..'

export const SubscriptionModel = addModel<Subscription>({
  name: 'subscription',
  attributes: {
    subscriptionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
    },
    orderId: {
      type: DataTypes.UUID,
    },
    priceId: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    title: {
      type: DataTypes.STRING,
    },
    canceledAt: {
      type: DataTypes.DATE,
    },
    cancelationReason: {
      type: DataTypes.STRING,
    },
  },
})
