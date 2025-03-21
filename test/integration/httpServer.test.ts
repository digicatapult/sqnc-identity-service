import type express from 'express'

import { expect } from 'chai'
import { before, describe, test } from 'mocha'

import createHttpServer from '../../src/server.js'
import { version } from '../../src/version.js'
import { getToken } from '../helper/auth.js'
import { healthCheck } from '../helper/routeHelper.js'

describe('health', function () {
  let app: express.Express
  let token: string

  before(async function () {
    app = await createHttpServer()
    token = await getToken('oauth2')
  })

  test('health check', async function () {
    const expectedResult = { status: 'ok', version }

    const actualResult = await healthCheck({ app, token })
    expect(actualResult.status).to.equal(200)
    expect(actualResult.body).to.deep.equal(expectedResult)
  })
})
