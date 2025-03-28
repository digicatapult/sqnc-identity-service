import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Env } from './env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Monkey-patch the generated swagger JSON so that when it is valid for the deployed environment.
 * Note this only effects the api-doc and not the functionality of the service
 * @param env Environment containing configuration for monkey-patching the swagger
 * @returns OpenAPI spec object
 */
export default async function loadApiSpec(env: Env): Promise<unknown> {
  const API_SWAGGER_HEADING = env.get('API_SWAGGER_HEADING')

  const swaggerBuffer = await fs.readFile(path.join(__dirname, './swagger.json'))
  const swaggerJson = JSON.parse(swaggerBuffer.toString('utf8'))
  swaggerJson.info.title += `:${API_SWAGGER_HEADING}`

  const tokenUrlOauth = `${env.get('IDP_PUBLIC_ORIGIN')}${env.get('IDP_PATH_PREFIX')}/realms/${env.get('IDP_OAUTH2_REALM')}/protocol/openid-connect/token`
  swaggerJson.components.securitySchemes.oauth2.flows.clientCredentials.tokenUrl = tokenUrlOauth
  swaggerJson.components.securitySchemes.oauth2.flows.clientCredentials.refreshUrl = tokenUrlOauth

  const tokenUrlInternal = `${env.get('IDP_PUBLIC_ORIGIN')}${env.get('IDP_PATH_PREFIX')}/realms/${env.get('IDP_INTERNAL_REALM')}/protocol/openid-connect/token`
  swaggerJson.components.securitySchemes.internal.flows.clientCredentials.tokenUrl = tokenUrlInternal
  swaggerJson.components.securitySchemes.internal.flows.clientCredentials.refreshUrl = tokenUrlInternal

  // if we're in production, remove the internal security scheme and references to it
  if (process.env.NODE_ENV !== 'dev') {
    delete swaggerJson.components.securitySchemes.internal
    Object.entries<object>(swaggerJson.paths).forEach(([, methods]) => {
      Object.entries(methods).forEach(([, method]) => {
        const security: unknown[] = method.security

        method.security = security.filter((security) => {
          return security && typeof security === 'object' && !('internal' in security)
        })
      })
    })
  }

  return swaggerJson
}
