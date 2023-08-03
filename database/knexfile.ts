import knex from "knex"

import type { Knex } from "knex"

export const tables = {
  upload: "upload",
}

const config: Knex.Config = {
  client: "better-sqlite3",
  connection: {
    filename: process.env.SQLITE_FILENAME || "./db.sqlite3",
  },
  migrations: {
    directory: process.env.SQLITE_MIGRATION || "./migrations",
  },
  useNullAsDefault: true,
}

export const db = knex(config)

export default config
