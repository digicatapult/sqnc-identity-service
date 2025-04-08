import { Knex } from 'knex'
import { z } from 'zod'

export const tablesList = ['members', 'roles'] as const

const insertRole = z.object({
  role: z.string().max(50),
})

const insertMember = z.object({
  alias: z.string().max(50),
  address: z.string().max(50),
  role: z.enum(['None', 'Optimiser']).default('None'),
})

const Zod = {
  members: {
    insert: insertMember,
    get: insertMember.extend({
      id: z.string(),
      created_at: z.date(),
      updated_at: z.date(),
    }),
  },
  roles: {
    insert: insertRole,
    get: insertRole.extend({
      id: z.string(),
    }),
  },
}

const { members, roles } = Zod

export type InsertMember = z.infer<typeof members.insert>
export type MemberRow = z.infer<typeof members.get>

export type InsertRole = z.infer<typeof roles.insert>
export type RoleRow = z.infer<typeof roles.get>

export type TABLES_TUPLE = typeof tablesList
export type TABLE = TABLES_TUPLE[number]
export type Models = {
  [key in TABLE]: {
    get: z.infer<(typeof Zod)[key]['get']>
    insert: z.infer<(typeof Zod)[key]['insert']>
  }
}

type WhereComparison<M extends TABLE> = {
  [key in keyof Models[M]['get']]: [
    Extract<key, string>,
    '=' | '>' | '>=' | '<' | '<=' | '<>',
    Extract<Models[M]['get'][key], Knex.Value>,
  ]
}
export type WhereMatch<M extends TABLE> = {
  [key in keyof Models[M]['get']]?: Models[M]['get'][key]
}

export type Where<M extends TABLE> = WhereMatch<M> | (WhereMatch<M> | WhereComparison<M>[keyof Models[M]['get']])[]
export type Order<M extends TABLE> = [keyof Models[M]['get'], 'asc' | 'desc'][]
export type Update<M extends TABLE> = Partial<Models[M]['get']>
export type IDatabase = {
  [key in TABLE]: () => Knex.QueryBuilder
}

export default Zod
