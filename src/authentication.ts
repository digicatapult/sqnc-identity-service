import type express from 'express'

import mkExpressAuthentication, { mergeAcceptAny } from '@digicatapult/tsoa-oauth-express'
import { container } from 'tsyringe'

import { Env } from './env.js'
const env = container.resolve(Env)

const makeAuth = (securityName: string, jwksUri: string) =>
  mkExpressAuthentication({
    verifyOptions: {},
    securityName,
    jwksUri: () => Promise.resolve(jwksUri),
    getAccessToken: (req: express.Request) =>
      Promise.resolve(req.headers['authorization']?.substring('bearer '.length)),
    getScopesFromToken: async (decoded) => {
      const scopes = typeof decoded === 'string' ? '' : `${decoded.scopes}`
      return scopes.split(' ')
    },
  })

export const expressAuthentication = mergeAcceptAny([
  makeAuth(
    'oauth2',
    `${env.get('IDP_INTERNAL_ORIGIN')}${env.get('IDP_PATH_PREFIX')}/realms/${env.get('IDP_OAUTH2_REALM')}/protocol/openid-connect/certs`
  ),
  makeAuth(
    'internal',
    `${env.get('IDP_INTERNAL_ORIGIN')}${env.get('IDP_PATH_PREFIX')}/realms/${env.get('IDP_INTERNAL_REALM')}/protocol/openid-connect/certs`
  ),
])
