import { Controller, Path, Put, Route, Security, SuccessResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import Database from '../../db/index.js'
import { logger } from '../../logger.js'

@Route('/v1/roles')
@Security('oauth2')
@Security('internal')
@injectable()
export class RolesController extends Controller {
  constructor(private db: Database) {
    super()
  }

  @SuccessResponse(200)
  @Put('/{role}')
  public async put(@Path('role') role: string) {
    logger.debug({ msg: 'new request received', controller: '/roles' })
    const existingRoles = await this.db.get('roles')
    if (existingRoles.find((r) => r.role === role)) {
      return // skip if role exists
    }
    await this.db.insert('roles', {
      role: role,
    })
  }
}
