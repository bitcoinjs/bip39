var mnemonicToEntropy = require('./mnemonicToEntropy')

function validateMnemonic (mnemonic, wordlist) {
  try {
    mnemonicToEntropy(mnemonic, wordlist)
  } catch (e) {
    return false
  }

  return true
}

module.exports = validateMnemonic
