import { Setting } from '../'
import { DataTypes } from 'sequelize'
import { addModel } from '../../db'

export const SettingModel = addModel<Setting>('setting', {
  name: {
    primaryKey: true,
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
  data: {
    type: DataTypes.JSONB,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
  },
})

export default SettingModel
