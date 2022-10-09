import { DataTypes, Sequelize } from 'sequelize'
import { MigrationFn } from 'umzug'

// Sync() will create any new objects but will not alter existing ones
// Migrations used for changes to existing objects to prevent data loss

export const up: MigrationFn = async ({ context }) => {
  const sequelize = context as Sequelize
  await sequelize.getQueryInterface().changeColumn('notice', 'title', {
    type: DataTypes.STRING,
  })
}

export const down: MigrationFn = async ({ context }) => {
  const sequelize = context as Sequelize
  await sequelize.getQueryInterface().changeColumn('notice', 'title', {
    type: DataTypes.STRING(255),
  })
}
