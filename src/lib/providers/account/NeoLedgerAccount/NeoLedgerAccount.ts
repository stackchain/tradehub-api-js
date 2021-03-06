import Transport from '@ledgerhq/hw-transport'

import { AddressOptions, getLedgerTransport, NEOAddress } from "../../../utils";
import NeonLedger, { getNEOBIP44String } from './NeonLedger'
import { AccountProvider } from "../AccountProvider";

const CONNECT_POLL_INTERVAL = 3000 // ms
const CONNECT_POLL_ATTEMPTS = 10 // attempts

export class NeoLedgerAccount extends AccountProvider {

  public readonly ledger: Transport
  public readonly publicKey: string
  public readonly scriptHash: string
  public readonly displayAddress: string

  private static _connectPolling = false

  private constructor(ledger: Transport, publicKey: string) {
    super()
    this.ledger = ledger
    this.publicKey = publicKey
    this.scriptHash = NEOAddress.publicKeyToScriptHash(publicKey)
    this.displayAddress = NEOAddress.publicKeyToAddress(publicKey)
  }

  static async connect() {
    let connectResult: [Transport, string] | null = null
    let connectionAttempts = 0

    NeoLedgerAccount._connectPolling = true

    while (connectionAttempts < CONNECT_POLL_ATTEMPTS) {
      connectionAttempts++

      // external signal to stop polling (e.g. timeout)
      // exit loop
      if (!NeoLedgerAccount._connectPolling) {
        break
      }

      // attempt ccnnect
      connectResult = await new Promise((resolve, reject) => {
        let timedOut = false

        // start timeout to kill connection when interval duration
        // is reached. Kills connection by resolving 
        let timeoutId = setTimeout(() => {
          // set timeout to true so that if connection is successful
          // after timeout, it can be ignored.
          timedOut = true

          // returns null result to indicate connection failure
          resolve(null)
        }, CONNECT_POLL_INTERVAL)

        NeoLedgerAccount.tryConnect().then(result => {
          // check for timeout signal, abandon result if timed out
          if (timedOut) return

          // clear timeout timer, so it doesn't trigger timeout action
          clearTimeout(timeoutId)

          // return positive connection result
          resolve(result)
        }).catch(reject)
      })

      // connection successful, exit loop
      if (connectResult) {
        break
      }
    }

    // failed to connect after specified timeout
    if (!connectResult) {
      throw new Error('Failed to connect with USB device, please try again.')
    }

    const [ledger, publicKey] = connectResult
    return new NeoLedgerAccount(ledger, publicKey)
  }

  /**
   * Used to try connecting with ledger, executes a public key request
   * on USB device to detect NEO app connection
   */
  private static async tryConnect(): Promise<[Transport, string]> {
    const bipString = getNEOBIP44String()
    const ledger = await getLedgerTransport()

    // get public key to assert that NEO app is open
    const publicKey = await NeonLedger.getPublicKey(ledger, bipString)

    return [ledger, publicKey]
  }

  configureAddress(options: AddressOptions) {
    this.options = options
  }

  async privateKey(): Promise<string> {
    throw new Error('Cannot retrieve private key from Ledger')
  }

  async sign(msg: string) {
    const bipString = getNEOBIP44String()
    const ledger = this.useLedger()
    return await NeonLedger.getSignature(ledger, msg, bipString)
  }

  private useLedger() {
    if (!this.ledger) {
      throw new Error('Ledger is not initialized')
    }

    return this.ledger
  }
}
