import type express from 'express'

import { expect } from 'chai'
import { afterEach, before, describe, test } from 'mocha'

import createHttpServer from '../../src/server.js'
import { getToken } from '../helper/auth.js'
import {
  getMemberByAliasOrAddressRoute,
  getMembersRoute,
  getSelfAddress,
  putMemberAliasRoute,
} from '../helper/routeHelper.js'
import { cleanup } from '../seeds/members.js'

const USER_ALICE_TOKEN = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
const USER_CHARLIE_TOKEN = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y'
const USER_BOB_TOKEN = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'

describe('routes', function () {
  this.timeout(3000)

  let app: express.Express
  let userToken: string
  let internalToken: string

  before(async function () {
    await cleanup()
    app = await createHttpServer()
    userToken = await getToken('oauth2')
    internalToken = await getToken('internal')
  })

  afterEach(async function () {
    await cleanup()
  })

  test('list membership members forbidden without auth', async function () {
    const res = await getMembersRoute({ app, token: 'invalid' })

    expect(res.status).to.equal(401)
  })

  test('return membership members', async function () {
    const expectedResult = [
      { address: USER_BOB_TOKEN, alias: USER_BOB_TOKEN },
      { address: USER_CHARLIE_TOKEN, alias: USER_CHARLIE_TOKEN },
      { address: USER_ALICE_TOKEN, alias: USER_ALICE_TOKEN },
    ]

    const res = await getMembersRoute({ app, token: userToken })

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('return membership members (internal)', async function () {
    const expectedResult = [
      { address: USER_BOB_TOKEN, alias: USER_BOB_TOKEN },
      { address: USER_CHARLIE_TOKEN, alias: USER_CHARLIE_TOKEN },
      { address: USER_ALICE_TOKEN, alias: USER_ALICE_TOKEN },
    ]

    const res = await getMembersRoute({ app, token: internalToken })

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('return membership members with aliases', async function () {
    const expectedResult = [
      { address: USER_BOB_TOKEN, alias: USER_BOB_TOKEN },
      { address: USER_CHARLIE_TOKEN, alias: 'CHARLIE' },
      { address: USER_ALICE_TOKEN, alias: USER_ALICE_TOKEN },
    ]

    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })
    const res = await getMembersRoute({ app, token: userToken })

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('update non-existing member alias', async function () {
    const expectedResult = { address: USER_CHARLIE_TOKEN, alias: 'CHARLIE' }

    const res = await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('update non-existing member alias (internal)', async function () {
    const expectedResult = { address: USER_CHARLIE_TOKEN, alias: 'CHARLIE' }

    const res = await putMemberAliasRoute({ app, token: internalToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('update non-existing member alias without token should 401', async function () {
    const res = await putMemberAliasRoute({ app, token: 'invalid' }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    expect(res.status).to.equal(401)
  })

  test('update existing member alias', async function () {
    const expectedResult = { message: 'member alias already exists' }

    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })
    const res = await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    expect(res.status).to.equal(409)
    expect(res.body).deep.equal(expectedResult)
  })

  test('update existing member alias', async function () {
    const expectedResult = { address: USER_CHARLIE_TOKEN, alias: 'CHARLIE_UPDATE' }

    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })
    const res = await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE_UPDATE' })

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('update alternative non-existing member with duplicate alias', async function () {
    const expectedResult = { message: 'member alias already exists' }

    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })
    const res = await putMemberAliasRoute({ app, token: userToken }, USER_BOB_TOKEN, { alias: 'CHARLIE' })

    expect(res.status).to.equal(409)
    expect(res.body).deep.equal(expectedResult)
  })

  test('get member by alias', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    const expectedResult = {
      address: USER_CHARLIE_TOKEN,
      alias: 'CHARLIE',
    }

    const res = await getMemberByAliasOrAddressRoute({ app, token: userToken }, 'CHARLIE')

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('get member by alias (internal)', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    const expectedResult = {
      address: USER_CHARLIE_TOKEN,
      alias: 'CHARLIE',
    }

    const res = await getMemberByAliasOrAddressRoute({ app, token: internalToken }, 'CHARLIE')

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('get member by alias with invalid token', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    const res = await getMemberByAliasOrAddressRoute({ app, token: 'invalid' }, 'CHARLIE')

    expect(res.status).to.equal(401)
  })

  test('get member by incorrect alias', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })
    const expectedResult = { message: 'Member does not exist' }

    const res = await getMemberByAliasOrAddressRoute({ app, token: userToken }, 'CHARLIE_UPDATE')

    expect(res.status).to.equal(404)
    expect(res.body).deep.equal(expectedResult)
  })

  test('get member by invalid alias', async function () {
    const invalidAlias = Array(256).fill('a').join('')

    const res = await getMemberByAliasOrAddressRoute({ app, token: userToken }, invalidAlias)

    expect(res.status).to.equal(422)
    expect(res.body.message).equal('Validation Failed')
  })

  test('get member by address', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_CHARLIE_TOKEN, { alias: 'CHARLIE' })

    const expectedResult = {
      address: USER_CHARLIE_TOKEN,
      alias: 'CHARLIE',
    }

    const res = await getMemberByAliasOrAddressRoute({ app, token: userToken }, USER_CHARLIE_TOKEN)

    expect(res.status).to.equal(200)
    expect(res.body).deep.equal(expectedResult)
  })

  test('get self address or return default', async function () {
    const { status, body } = await getSelfAddress({ app, token: userToken })
    expect(status).to.equal(200)
    expect(body).to.deep.equal({
      address: USER_BOB_TOKEN,
      alias: USER_BOB_TOKEN,
    })
  })

  test('get self address with invalid token', async function () {
    const { status } = await getSelfAddress({ app, token: 'invalid' })
    expect(status).to.equal(401)
  })

  test('get self address with alias', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_BOB_TOKEN, { alias: 'TEST' })
    const { status, body } = await getSelfAddress({ app, token: userToken })
    expect(status).to.equal(200)
    expect(body).to.deep.equal({
      address: USER_BOB_TOKEN,
      alias: 'TEST',
    })
  })

  test('get self address with alias (internal)', async function () {
    await putMemberAliasRoute({ app, token: userToken }, USER_BOB_TOKEN, { alias: 'TEST' })
    const { status, body } = await getSelfAddress({ app, token: internalToken })
    expect(status).to.equal(200)
    expect(body).to.deep.equal({
      address: USER_BOB_TOKEN,
      alias: 'TEST',
    })
  })
})
