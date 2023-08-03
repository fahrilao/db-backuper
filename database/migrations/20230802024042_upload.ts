import { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("upload", (table) => {
    table.increments("id")
    table.string("upload_url").notNullable()
    table.string("filepath").notNullable()
    table.double("rest_start").notNullable()
    table.double("rest_end").nullable()
    table.double("filesize").notNullable()
    table.boolean("status").notNullable()
    table.timestamp("created_at").defaultTo(new Date())
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("upload")
}
