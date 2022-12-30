import { Setting } from '..'
import { DataTypes } from 'sequelize'
import { addModel } from '../../../shared/db'

export const SettingModel = addModel<Setting>('setting', {
  name: {
    primaryKey: true,
    type: DataTypes.STRING,
  },
  data: {
    type: DataTypes.JSONB,
  },
})

export default SettingModel
