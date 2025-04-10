import knex from 'knex'
import { container } from 'tsyringe'
import Database from './index.js'
import { TABLE, Where } from './types.js'

// reduces the where condition on a knex query. Gracefully handles undefined values in WhereMatch objects
export const reduceWhere = <M extends TABLE>(
  query: knex.Knex.QueryBuilder,
  where?: Where<M>
): knex.Knex.QueryBuilder => {
  if (where) {
    if (!Array.isArray(where)) {
      where = [where]
    }
    query = where.reduce((acc, w) => {
      if (Array.isArray(w)) {
        return acc.where(w[0], w[1], w[2])
      }
      return acc.where(
        Object.entries(w).reduce(
          (acc, [k, v]) => {
            if (v !== undefined) acc[k] = v
            return acc
          },
          {} as Record<string, unknown>
        )
      )
    }, query)
  }
  return query
}

export async function getRoles(): Promise<string[]> {
  const db = container.resolve(Database)
  const roles = await db.get('roles')
  return roles.map((role) => role.role)
}
