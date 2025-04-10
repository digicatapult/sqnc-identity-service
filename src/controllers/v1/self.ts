import { Controller, Get, Route, Security, SuccessResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import ChainNode from '../../chainNode.js'
import Database from '../../db/index.js'
import { Env } from '../../env.js'
import { NotFound } from '../../errors.js'
import { logger } from '../../logger.js'
import { Member } from '../../responses.js'

@Route('/v1/self')
@Security('oauth2')
@Security('internal')
@injectable()
export class SelfController extends Controller {
  constructor(
    private env: Env,
    private db: Database,
    private node: ChainNode
  ) {
    super()
  }

  @SuccessResponse(200)
  @Get('/')
  public async get(): Promise<Member> {
    logger.debug({ msg: 'new request received', controller: '/self' })

    const address = this.env.get('SELF_ADDRESS')

    const fromDb = await this.db.get('members', { address })

    if (fromDb.length !== 0) {
      const self = fromDb[0]
      return {
        alias: self.alias,
        address: self.address,
        role: 'Self',
      }
    }

    const members = await this.node.getMembers()
    if (members.indexOf(address) !== -1) {
      return {
        alias: address,
        address,
        role: 'Self',
      }
    }

    throw new NotFound()
  }
}
