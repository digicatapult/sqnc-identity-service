import type { Address, AddressOrAlias, Alias, Member } from '../../responses.js'

import { Body, Controller, Get, Path, Put, Response, Route, Security, SuccessResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import ChainNode from '../../chainNode.js'
import Database from '../../db/index.js'
import { Env } from '../../env.js'
import { BadRequest, Conflict, NotFound } from '../../errors.js'
import { logger } from '../../logger.js'

export const addrRegex = /^[1-9A-HJ-NP-Za-km-z]{48}$/

@Route('/v1/members')
@Security('oauth2')
@Security('internal')
@injectable()
export class MembersController extends Controller {
  constructor(
    private db: Database,
    private node: ChainNode,
    private env: Env
  ) {
    super()
  }

  @SuccessResponse(200)
  @Get('/')
  public async list(): Promise<Member[]> {
    logger.debug({ msg: 'new request received', controller: '/members' })

    const nodeMembers = await this.node.getMembers()
    const fromDb = await this.db.get('members')
    const selfAddress = this.env.get('SELF_ADDRESS')

    return nodeMembers.map((address) => {
      const member = fromDb.find((member) => member.address === address)
      const role = address === selfAddress ? 'Self' : member?.role || 'None'

      return {
        address,
        alias: member?.alias || address,
        role,
      }
    })
  }

  @SuccessResponse(200)
  @Response<NotFound>(404, 'Not found')
  @Get('/{aliasOrAddress}')
  public async get(@Path('aliasOrAddress') aliasOrAddress: AddressOrAlias): Promise<Member> {
    const filter = aliasOrAddress.match(addrRegex) ? { address: aliasOrAddress } : { alias: aliasOrAddress }

    const [fromDb] = await this.db.get('members', filter)

    if (fromDb) {
      return {
        alias: fromDb.alias,
        address: fromDb.address,
        role: fromDb.role,
      }
    }

    if (filter.alias) {
      throw new NotFound('Member does not exist')
    }

    const nodeMembers = await this.node.getMembers()
    if (!nodeMembers.includes(aliasOrAddress)) {
      throw new NotFound('Member does not exist')
    }
    if (aliasOrAddress === this.env.get('SELF_ADDRESS')) {
      return {
        alias: aliasOrAddress,
        address: aliasOrAddress,
        role: 'Self',
      }
    }

    return {
      alias: aliasOrAddress,
      address: aliasOrAddress,
      role: 'None',
    }
  }

  @SuccessResponse(200)
  @Response<NotFound>(404, 'Not found')
  @Response<Conflict>(409, 'Conflict')
  @Put('/{address}')
  public async put(
    @Path('address') address: Address,
    @Body() body: { alias: Alias; role?: 'None' | 'Optimiser' }
  ): Promise<Member> {
    const { alias } = body
    const role = body.role ?? 'None'
    const fromDb = await this.db.get('members')
    const fromNode = await this.node.getMembers()

    if (!fromNode.includes(address)) {
      throw new NotFound()
    }

    const matchMemberByAddress = fromDb.find((member) => member.address === address)
    const matchMemberByAlias = fromDb.find((member) => member.alias === alias)

    if (matchMemberByAlias) {
      throw new Conflict('member alias already exists')
    }
    if (address === this.env.get('SELF_ADDRESS') && role === 'Optimiser') {
      throw new BadRequest('cannot update role for self')
    }

    if (!matchMemberByAddress) {
      await this.db.insert('members', { address, alias, role })
      return {
        address,
        alias,
        role,
      }
    }

    await this.db.update('members', { address }, { alias, role })
    return { address, alias, role }
  }
}
