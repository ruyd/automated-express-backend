import fs from 'fs'
import { Umzug } from 'umzug'
import { Connection } from '.'
import path from 'path'

export const umzug = new Umzug({
  create: {
    folder: path.resolve(__dirname, 'migrations'),
    template: filePath => [
      [filePath, fs.readFileSync(path.resolve(__dirname, 'template.ts')).toString()],
    ],
  },
  migrations: {
    glob: ['migrations/*.{ts,up.sql}', { cwd: __dirname }],
    resolve: params => {
      if (params.path && !params.path.endsWith('.sql')) {
        return Umzug.defaultResolver(params)
      }
      const { context: sequelize } = params
      const ppath = params.path as string
      return {
        name: params.name,
        up: async () => {
          const sql = fs.readFileSync(ppath).toString()
          return sequelize.query(sql)
        },
        down: async () => {
          // Get the corresponding `.down.sql` file to undo this migration
          const sql = fs.readFileSync(ppath.replace('.up.sql', '.down.sql')).toString()
          return sequelize.query(sql)
        },
      }
    },
  },
  logger: console,
  context: Connection?.db,
})

if (require.main === module) {
  umzug.runAsCLI()
}

export default umzug
