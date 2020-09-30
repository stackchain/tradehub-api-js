const { WalletClient } = require('../build/main')

const net = 'LOCALHOST'
// const net = 'DEVNET'

async function run() {
  const mnemonic = 'joke water monkey survey tip silly satisfy speak document chief elegant hand'
  const account = await WalletClient.connectMnemonic(mnemonic, net)
  console.log('connected account')
  const address = await account.getDepositAddress('eth', net)
  console.log('swth address', account.pubKeyBech32)
  console.log('deposit address', address)
  await account.watchEthDepositAddress()
}

run()
