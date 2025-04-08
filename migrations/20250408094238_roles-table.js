export const up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')

  await knex.schema.createTable('roles', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4()).primary()
    def.string('role', 50).notNullable().unique()
  })
  await knex.schema.alterTable('members', (def) => {
    def.uuid('role_id').references('id').inTable('roles').notNullable().onDelete('CASCADE')
  })
}

export const down = async (knex) => {
  await knex.schema.alterTable('members', (def) => {
    def.dropColumn('role_id')
  })
  await knex.schema.dropTable('roles')
}
