import { AggregateOAuthError, OauthError } from '@digicatapult/tsoa-oauth-express'
import compression from 'compression'
import cors from 'cors'
import express, { Express } from 'express'
import promBundle from 'express-prom-bundle'
import { pinoHttp } from 'pino-http'
import { SwaggerUiOptions, serve, setup } from 'swagger-ui-express'
import { ValidateError } from 'tsoa'
import { container } from 'tsyringe'

import { Env } from './env.js'
import { HttpError } from './errors.js'
import { ILogger, Logger } from './logger.js'
import { RegisterRoutes } from './routes.js'
import loadApiSpec from './swagger.js'

const env = container.resolve(Env)
const logger = container.resolve<ILogger>(Logger)

const API_SWAGGER_BG_COLOR = env.get('API_SWAGGER_BG_COLOR')
const API_SWAGGER_TITLE = env.get('API_SWAGGER_TITLE')

const customCssToInject: string = `
  body { background-color: ${API_SWAGGER_BG_COLOR}; }
  .swagger-ui .scheme-container { background-color: inherit; }
  .swagger-ui .opblock .opblock-section-header { background: inherit; }
  .topbar { display: none; }
  .swagger-ui .btn.authorize { background-color: #f7f7f7; }
  .swagger-ui .opblock.opblock-post { background: rgba(73,204,144,.3); }
  .swagger-ui .opblock.opblock-get { background: rgba(97,175,254,.3); }
  .swagger-ui .opblock.opblock-put { background: rgba(252,161,48,.3); }
  .swagger-ui .opblock.opblock-delete { background: rgba(249,62,62,.3); }
  .swagger-ui section.models { background-color: #f7f7f7; }

`

export default async (): Promise<Express> => {
  const app: Express = express()

  const options: SwaggerUiOptions = {
    swaggerOptions: { url: '/api-docs', oauth: { clientId: env.get('IDP_CLIENT_ID') } },
    customCss: customCssToInject,
    customSiteTitle: API_SWAGGER_TITLE,
  }

  const requestLogger = pinoHttp({ logger })

  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())
  app.use(cors())
  app.use(compression())

  app.use(
    promBundle({
      includePath: true,
      promClient: {
        collectDefaultMetrics: {
          prefix: 'sqnc_identity_service_',
        },
      },
    })
  )

  app.get('/api-docs', async (_req, res) => {
    const swagger = await loadApiSpec(env)
    res.json(swagger)
  })
  app.use('/swagger', serve, setup(undefined, options))

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  RegisterRoutes(app)

  app.use(function errorHandler(
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    if (err instanceof OauthError || err instanceof AggregateOAuthError) {
      res.status(401).send({
        message: 'Forbidden',
      })
    }

    if (err instanceof HttpError) {
      res.status(err.code).send({
        message: err.message,
      })
    }

    if (err instanceof ValidateError) {
      res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      })
    }
    if (err instanceof Error) {
      res.status(500).json({
        message: 'Internal Server Error',
      })
    }

    next()
  })

  return app
}
