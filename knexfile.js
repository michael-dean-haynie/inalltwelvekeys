/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.db.sqlite3'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: './db.sqlite3'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
}
