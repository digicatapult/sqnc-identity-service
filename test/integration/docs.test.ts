import type express from 'express'

import { expect } from 'chai'
import { before, describe, it } from 'mocha'

import createHttpServer from '../../src/server.js'
import { getToken } from '../helper/auth.js'
import { apiDocs } from '../helper/routeHelper.js'

describe('api-docs', function () {
  let app: express.Express
  let token: string

  before(async function () {
    app = await createHttpServer()
    token = await getToken('oauth2')
  })

  it('should return 200', async function () {
    const actualResult = await apiDocs({ app, token })

    expect(actualResult.status).to.equal(200)
    expect(actualResult.body).to.have.property('openapi')
    expect(actualResult.body).to.have.property('info')
  })
})
