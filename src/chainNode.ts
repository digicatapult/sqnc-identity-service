import { ApiPromise, WsProvider } from '@polkadot/api'
import { Mutex } from 'async-mutex'

import { Logger } from 'pino'
import { injectable, singleton } from 'tsyringe'
import { z } from 'zod'

import { Env } from './env.js'
import { logger } from './logger.js'

const listParser = z.array(z.string())
const addressParser = z.object({
  literal: z.string().regex(/^0x[0-9a-fA-F]+$/), // Ensures the string is a valid hex
})

type OrgData = {
  account: string
  attachmentEndpointAddress: string
  oidcConfigurationEndpointAddress: string
}

@singleton()
@injectable()
export default class ChainNode {
  protected provider: WsProvider
  protected api: ApiPromise
  protected mutex = new Mutex()
  protected proxyAddress: string | null = null
  protected logger: Logger

  constructor(protected env: Env) {
    this.logger = logger.child({ module: 'ChainNode' })
    this.provider = new WsProvider(`ws://${this.env.get('API_HOST')}:${this.env.get('API_PORT')}`)
    this.api = new ApiPromise({ provider: this.provider })

    this.api.isReadyOrError.catch(() => {
      // prevent unhandled promise rejection errors
    })

    this.api.on('disconnected', () => {
      this.logger.warn(`Disconnected from substrate node at ${this.env.get('API_HOST')}:${this.env.get('API_PORT')}`)
    })

    this.api.on('connected', () => {
      this.logger.info(`Connected to substrate node at ${this.env.get('API_HOST')}:${this.env.get('API_PORT')}`)
    })

    this.api.on('error', (err) => {
      this.logger.error(`Error from substrate node connection. Error was ${err.message || JSON.stringify(err)}`)
    })
  }

  async getMembers() {
    await this.api.isReady
    const members = (await this.api.query.membership.members()).toJSON()
    return listParser.parse(members)
  }

  async getAttachmentApiAddresses(account: string): Promise<OrgData> {
    await this.api.isReady
    // Call the organisationData RPC method with the appropriate parameters
    const attachmentKey = 'AttachmentEndpoint'
    const oidcKey = 'OidcConfigurationEndpoint'
    let decodedLiterals: OrgData | null = null

    const attachmentAddresses = await this.api.query.organisationData.orgData(account, attachmentKey)
    const oidcAddresses = await this.api.query.organisationData.orgData(account, oidcKey)

    if (attachmentAddresses && oidcAddresses) {
      const jsonAddress = attachmentAddresses.toJSON()
      const jsonOidcAddress = oidcAddresses.toJSON()

      const decodedAttachment = await this.parseAndDecodeAddress(jsonAddress)
      const decodedOidc = await this.parseAndDecodeAddress(jsonOidcAddress)

      if (decodedAttachment !== null && decodedOidc !== null) {
        decodedLiterals = {
          account: account,
          attachmentEndpointAddress: decodedAttachment,
          oidcConfigurationEndpointAddress: decodedOidc,
        }
      }
    }

    return decodedLiterals !== null
      ? decodedLiterals
      : {
          account: account,
          attachmentEndpointAddress: '',
          oidcConfigurationEndpointAddress: '',
        }
  }

  async parseAndDecodeAddress(jsonAddress: any): Promise<string | null> {
    try {
      const parsedAddress = addressParser.parse(jsonAddress)
      const decodedAddressLiteral = hexToAscii(parsedAddress.literal)

      // Validate if the decoded address is a valid URL
      if (new URL(decodedAddressLiteral)) {
        return decodedAddressLiteral
      }
    } catch (error) {
      this.logger.error(`Error parsing and decoding address: ${error}`)
    }
    return null
  }
}

function hexToAscii(hex: string): string {
  const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex

  // Convert hex to a buffer and then to a string
  const bytes = Buffer.from(hexWithoutPrefix, 'hex')
  return bytes.toString('utf8')
}
