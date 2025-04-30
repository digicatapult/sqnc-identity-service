import { type Address, type AddressOrAlias, type Member, type MemberBody } from '../../responses.js'

import { Body, Controller, Get, Patch, Path, Response, Route, Security, SuccessResponse } from 'tsoa'
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
    const fromRoles = await this.db.get('roles')
    const selfAddress = this.env.get('SELF_ADDRESS')

    return nodeMembers.map((address) => {
      const member = fromDb.find((member) => member.address === address)
      const roleFromDb = fromRoles.find((role) => role.id === member?.role_id)
      const role = address === selfAddress ? 'Self' : roleFromDb?.role || undefined

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
    let role: string | undefined = undefined
    const [fromDb] = await this.db.get('members', filter)
    if (fromDb && fromDb.role_id !== null) {
      const [fromRoles] = await this.db.get('roles', { id: fromDb.role_id })
      role = fromRoles?.role
    }
    if (fromDb) {
      return {
        alias: fromDb.alias,
        address: fromDb.address,
        role: role,
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
      role: role,
    }
  }

  @SuccessResponse(200)
  @Response<NotFound>(404, 'Not found')
  @Response<Conflict>(409, 'Conflict')
  @Patch('/{address}')
  public async patch(@Path('address') address: Address, @Body() body: MemberBody): Promise<Member> {
    const { alias, role: roleName } = body
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

    // If no alias or role is provided, return the current member data
    if (!alias && !roleName && matchMemberByAddress) {
      return {
        address,
        alias: matchMemberByAddress.alias,
        role: matchMemberByAddress.role_id
          ? (await this.db.get('roles', { id: matchMemberByAddress.role_id }))[0]?.role
          : undefined,
      }
    }
    // Check if the address is self and role update is attempted
    if (address === this.env.get('SELF_ADDRESS') && roleName) {
      throw new BadRequest('cannot update role for self')
    }

    // Prepare update data
    const updateData: { alias?: string; role_id?: string } = {}
    if (alias) {
      updateData.alias = alias
    }

    if (roleName) {
      const [roleFromDb] = await this.db.get('roles', { role: roleName })
      if (!roleFromDb) {
        throw new BadRequest('Invalid role')
      }
      updateData.role_id = roleFromDb.id
    }

    // Update the member if there is one
    if (matchMemberByAddress) {
      const [updatedMember] = await this.db.update('members', { address }, updateData)
      const role = updatedMember.role_id
        ? (await this.db.get('roles', { id: updatedMember.role_id }))[0]?.role
        : undefined
      return {
        address: updatedMember.address,
        alias: updatedMember.alias,
        role,
      }
    }
    // Insert new member if not found
    await this.db.insert('members', { address, alias: alias ? alias : address, role_id: updateData.role_id || null })
    return {
      address,
      alias: alias ? alias : address,
      role: roleName || undefined,
    }
  }

  @SuccessResponse(200)
  @Response<NotFound>(404, 'Not found')
  @Get('/{address}/org-data')
  public async getOrgData(@Path('address') address: string) {
    const orgData = await this.node.getAttachmentApiAddresses(address)
    return orgData
  }
}
