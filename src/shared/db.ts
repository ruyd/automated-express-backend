import { ModelOptions, Sequelize } from 'sequelize'
import config from './config'

export const commonOptions: ModelOptions = {
  timestamps: true,
  underscored: true,
}

const sequelize = new Sequelize(config.db.url, {
  ssl: config.db.ssl,
})

export default sequelize
