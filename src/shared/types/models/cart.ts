import { addModel } from '../../db'
import { Cart } from '..'
import { DataTypes } from 'sequelize'
import { DrawingModel } from './drawing'
import { ProductModel } from './product'

export const CartAttributes = {
  cartId: {
    primaryKey: true,
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.UUID,
  },
  cartType: {
    type: DataTypes.STRING,
  },
  productId: {
    type: DataTypes.STRING,
  },
  priceId: {
    type: DataTypes.STRING,
  },
  drawingId: {
    type: DataTypes.UUID,
  },
  quantity: {
    type: DataTypes.INTEGER,
  },
}

export const CartModel = addModel<Cart>({
  name: 'cart',
  attributes: CartAttributes,
  joins: [
    {
      type: 'belongsTo',
      target: DrawingModel,
      foreignKey: 'drawingId',
      as: 'drawing',
    },
    {
      type: 'belongsTo',
      target: ProductModel,
      foreignKey: 'productId',
      as: 'product',
    },
  ],
})

export default CartModel
