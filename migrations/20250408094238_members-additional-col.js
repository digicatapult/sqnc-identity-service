export const up = async (knex) => {
  await knex.schema.alterTable('members', (def) => {
    def.string('role', 20).notNullable().defaultTo('None')
  })
}

export const down = async (knex) => {
  await knex.schema.alterTable('members', (def) => {
    def.dropColumn('role')
  })
}
