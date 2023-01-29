import { Sequelize } from 'sequelize'

// Sync() will create any new objects but will not alter existing ones
// Migrations used for changes to existing objects to prevent data loss

export const up = async ({ context }: { context: Sequelize }) => {
  const qi = context.getQueryInterface()
  const transaction = await context.transaction()
  try {
    // changes
    qi.changeColumn
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const down = async ({ context }: { context: Sequelize }) => {
  context.getQueryInterface
  //await context.getQueryInterface().removeX
}
