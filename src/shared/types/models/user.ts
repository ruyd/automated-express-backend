import { Address, PaymentMethod, User, UserActive } from '..'
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
}

export const UserModel = addModel<User>('user', UserAttributes)

export const UserActiveModel = addModel<UserActive>('user_active', {
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
})

export const AddressModel = addModel<Address>('address', {
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
})

export const PaymentMethodModel = addModel<PaymentMethod>('payment_method', {
  paymentMethodId: {
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
  type: {
    type: DataTypes.STRING,
  },
  last4: {
    type: DataTypes.STRING,
  },
  expMonth: {
    type: DataTypes.INTEGER,
  },
  expYear: {
    type: DataTypes.INTEGER,
  },
  default: {
    type: DataTypes.BOOLEAN,
  },
})
