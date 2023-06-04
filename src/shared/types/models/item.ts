import { DataTypes } from 'sequelize'
import { EntityDefinition, Join } from '../../db'
import { Item } from '..'
import { CategoryModel } from './category'
import { addModel } from '../../db'

export const ItemDefinition: EntityDefinition<Item> = {
  itemId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
  },
  urlName: {
    type: DataTypes.STRING,
  },
  subscriptions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  tokens: {
    type: DataTypes.INTEGER,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  currency: {
    type: DataTypes.STRING,
  },
  inventory: {
    type: DataTypes.INTEGER,
  },
  paywall: {
    type: DataTypes.BOOLEAN,
  },
}

const joins: Join[] = [
  {
    target: CategoryModel,
    through: 'itemCategory',
    type: 'belongsToMany',
    foreignKey: 'itemId',
    otherKey: 'categoryId',
  },
]

export const ItemModel = addModel<Item>({
  name: 'item',
  attributes: ItemDefinition,
  joins,
})
