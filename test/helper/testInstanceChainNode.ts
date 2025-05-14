import { Keyring, SubmittableResult } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'

import { Mutex } from 'async-mutex'
import ChainNode from '../../src/chainNode.js'
import { type Env } from '../../src/env.js'

export default class ExtendedChainNode extends ChainNode {
  protected keyring: Keyring
  protected userUri: string
  protected lastSubmittedNonce: number
  protected mutex = new Mutex()
  protected proxyAddress: string | null = null
  constructor(env: Env) {
    super(env)
    this.keyring = new Keyring({ type: 'sr25519' })
    this.userUri = '//Alice'
    this.lastSubmittedNonce = -1
  }

  async prepareProcess(seedData: {
    key: string
    value: string
    preimage?: boolean | undefined
  }): Promise<SubmittableExtrinsic<'promise', SubmittableResult>> {
    await this.api.isReady
    const key = { [seedData.key]: null }
    const value = seedData.preimage ? { Preimage: seedData.value } : { Literal: seedData.value }

    // Create the extrinsic with seed data
    let extrinsic: SubmittableExtrinsic<'promise', SubmittableResult> = this.api.tx.organisationData.setValue(
      key,
      value
    )
    if (this.proxyAddress) {
      extrinsic = this.api.tx.proxy.proxy({ id: this.proxyAddress }, null, extrinsic)
    }
    const account = this.keyring.addFromUri(this.userUri)

    const nonce = await this.mutex.runExclusive(async () => {
      const nextTxPoolNonce = (await this.api.rpc.system.accountNextIndex(account.publicKey)).toNumber()
      const nonce = Math.max(nextTxPoolNonce, this.lastSubmittedNonce + 1)
      this.lastSubmittedNonce = nonce
      return nonce
    })

    const signed = await extrinsic.signAsync(account, { nonce })
    return signed
  }

  async notePreimage(url: string) {
    await this.api.isReady
    let extrinsic: SubmittableExtrinsic<'promise', SubmittableResult> = this.api.tx.preimage.notePreimage(url)
    const account = this.keyring.addFromUri(this.userUri)

    const nonce = await this.mutex.runExclusive(async () => {
      const nextTxPoolNonce = (await this.api.rpc.system.accountNextIndex(account.publicKey)).toNumber()
      const nonce = Math.max(nextTxPoolNonce, this.lastSubmittedNonce + 1)
      this.lastSubmittedNonce = nonce
      return nonce
    })

    const signed = await extrinsic.signAsync(account, { nonce })
    return signed
  }
  async unnotePreimage(hash: string) {
    await this.api.isReady
    let extrinsic: SubmittableExtrinsic<'promise', SubmittableResult> = this.api.tx.preimage.unnotePreimage(hash)
    const account = this.keyring.addFromUri(this.userUri)

    const nonce = await this.mutex.runExclusive(async () => {
      const nextTxPoolNonce = (await this.api.rpc.system.accountNextIndex(account.publicKey)).toNumber()
      const nonce = Math.max(nextTxPoolNonce, this.lastSubmittedNonce + 1)
      this.lastSubmittedNonce = nonce
      return nonce
    })

    const signed = await extrinsic.signAsync(account, { nonce })
    return signed
  }

  async submitProcess(extrinsic: SubmittableExtrinsic<'promise', SubmittableResult>) {
    try {
      this.logger.debug('Submitting  Transaction %j', extrinsic.hash.toHex())
      const unsub: () => void = await extrinsic.send((result: SubmittableResult): void => {
        this.logger.debug('result.status %s', JSON.stringify(result.status))

        const { dispatchError, status } = result
        if (dispatchError) {
          this.logger.warn('dispatch error %s', dispatchError)
          unsub()
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule)
            throw new Error(`Node dispatch error: ${decoded.name}`)
          }

          throw new Error(`Unknown node dispatch error: ${dispatchError}`)
        }

        if (status.isFinalized) {
          unsub()
        }
      })
    } catch (err) {
      this.logger.warn(`Error in seed transaction: ${err}`)
    }
  }
  // continue sealing blocks if there are transactions
  async clearAllTransactions(createEmpty: boolean = true, finalise: boolean = true) {
    while (true) {
      const pending = await this.api.rpc.author.pendingExtrinsics()
      if (pending.length === 0) {
        return
      }
      await this.api.rpc.engine.createBlock(createEmpty, finalise)
    }
  }
}
