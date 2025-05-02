import dotenv from 'dotenv'
import * as envalid from 'envalid'
import { singleton } from 'tsyringe'

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: 'test/test.env' })
} else {
  dotenv.config()
}

const envConfig = {
  SELF_ADDRESS: envalid.str({ devDefault: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' }),
  SERVICE_TYPE: envalid.str({ default: 'sqnc-identity-service'.toUpperCase().replace(/-/g, '_') }),
  PORT: envalid.port({ default: 3000 }),
  API_HOST: envalid.host({ devDefault: 'localhost' }),
  API_PORT: envalid.port({ default: 9944 }),
  LOG_LEVEL: envalid.str({ default: 'info', devDefault: 'debug' }),
  DB_HOST: envalid.host({ devDefault: 'localhost' }),
  DB_PORT: envalid.port({ default: 5432 }),
  DB_NAME: envalid.str({ default: 'sqnc' }),
  USER_URI: envalid.str({ devDefault: '//Alice' }), //instead of this should we be getting self address or sth?
  DB_USERNAME: envalid.str({ devDefault: 'postgres' }),
  DB_PASSWORD: envalid.str({ devDefault: 'postgres' }),
  API_SWAGGER_BG_COLOR: envalid.str({ default: '#fafafa' }),
  API_SWAGGER_TITLE: envalid.str({ default: 'IdentityAPI' }),
  API_SWAGGER_HEADING: envalid.str({ default: 'IdentityService' }),
  IDP_CLIENT_ID: envalid.str({ devDefault: 'sqnc-identity-service' }),
  IDP_PUBLIC_ORIGIN: envalid.url({
    devDefault: 'http://localhost:3080',
  }),
  IDP_INTERNAL_ORIGIN: envalid.url({
    devDefault: 'http://localhost:3080',
  }),
  IDP_PATH_PREFIX: envalid.str({
    default: '/auth',
    devDefault: '',
  }),
  IDP_OAUTH2_REALM: envalid.str({
    devDefault: 'sequence',
  }),
  IDP_INTERNAL_REALM: envalid.str({
    devDefault: 'internal',
  }),
}

export type ENV_CONFIG = typeof envConfig
export type ENV_KEYS = keyof ENV_CONFIG

@singleton()
export class Env {
  private vals: envalid.CleanedEnv<typeof envConfig>

  constructor() {
    this.vals = envalid.cleanEnv(process.env, envConfig)
  }

  get<K extends ENV_KEYS>(key: K) {
    return this.vals[key]
  }
}
