import { Address, User, UserActive } from '..'
import { DataTypes } from 'sequelize'
import { addModel } from '../../db'

export const UserAttributes = {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  picture: {
    type: DataTypes.STRING,
  },
  roles: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
}

export const UserModel = addModel<User>({ name: 'user', attributes: UserAttributes })

export const UserActiveModel = addModel<UserActive>({
  name: 'user_active',
  attributes: {
    socketId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
    },
    ip: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.STRING,
    },
  },
})

export const AddressModel = addModel<Address>({
  name: 'address',
  attributes: {
    addressId: {
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
    address1: {
      type: DataTypes.STRING,
    },
    address2: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    zip: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
    },
    default: {
      type: DataTypes.BOOLEAN,
    },
  },
})
