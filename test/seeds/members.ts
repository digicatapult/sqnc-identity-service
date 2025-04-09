import { container } from 'tsyringe'

import Database from '../../src/db/index.js'

const db = container.resolve(Database)

export const cleanup = async () => {
  await db.delete('members', {})
  await db.delete('roles', {})
}
