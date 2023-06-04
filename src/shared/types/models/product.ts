import { Product } from '..'
import { DataTypes } from 'sequelize'
import { addModel } from 'src/shared/db'
// import { CategoryModel } from './category'

export const ProductDefinition = {
  productId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    required: true,
  },
  description: {
    type: DataTypes.STRING,
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  keywords: {
    type: DataTypes.STRING,
  },
  prices: {
    type: DataTypes.JSONB,
  },
  shippable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}

export const ProductModel = addModel<Product>({ name: 'product', attributes: ProductDefinition })
