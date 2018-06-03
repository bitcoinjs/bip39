var mnemonicToSeed = require('./mnemonicToSeed')

function mnemonicToSeedHex (mnemonic, password) {
  return mnemonicToSeed(mnemonic, password).toString('hex')
}

module.exports = mnemonicToSeedHex
