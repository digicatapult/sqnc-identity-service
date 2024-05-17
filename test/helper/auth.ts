import { container } from 'tsyringe'

import { Env } from '../../src/env.js'

const env = container.resolve(Env)

export const getToken = async () => {
  const tokenReq = await fetch(`${env.get('IDP_PUBLIC_URL_PREFIX')}${env.get('IDP_TOKEN_PATH')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.get('IDP_CLIENT_ID'),
      client_secret: 'secret',
    }),
  })

  if (!tokenReq.ok) {
    throw new Error(`Error getting token from keycloak ${tokenReq.statusText}`)
  }

  const body = (await tokenReq.json()) as any
  return body.access_token as string
}
