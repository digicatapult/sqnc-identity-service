export const up = async (knex) => {
  // check extension is not installed
  const [extInstalled] = await knex('pg_extension').select('*').where({ extname: 'uuid-ossp' })

  if (!extInstalled) {
    await knex.raw('CREATE EXTENSION "uuid-ossp"')
  }

  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('members', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.string('address', 50).unique().notNullable()
    def.string('alias', 50).unique().notNullable()
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.primary(['id'])
  })
}

export const down = async (knex) => {
  await knex.schema.dropTable('members')
  await knex.raw('DROP EXTENSION "uuid-ossp"')
}
