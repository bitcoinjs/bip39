var bip39 = require('../')

// Manual conversion from mnemonic to Seedhex
var mnemonic = 'legend trust army surround organ clinic man impose arrow language island can'
var seedHex = bip39.mnemonicToSeedHex(mnemonic)
console.log('Deterministic Mnemonic: ' + mnemonic + '\n' + 'Seedhex: ', seedHex, '\n')

// generate mnemonic and its corresponding seedhex ``
mnemonic = bip39.generateMnemonic()
seedHex = bip39.mnemonicToSeedHex(mnemonic)
console.log('Generated Mnemonic: ' + mnemonic + '\n' + 'Generated Mnemonic\'s SeedHex: ' + seedHex)

// If Mnemonic is passed as arguement, provides seedHex else generates one and logs it
function genSeedhex (mnemonic) {
  if (mnemonic != null) {
    var seedHex = bip39.mnemonicToSeedHex(mnemonic)
    console.log('Mnemonic: ' + mnemonic + '\n' + 'Seedhex: ', seedHex, '\n')
  } else {
    mnemonic = bip39.generateMnemonic()
    seedHex = bip39.mnemonicToSeedHex(mnemonic)
    console.log('Generated Mnemonic: ' + mnemonic + '\n' + 'Generated Mnemonic\'s SeedHex: ' + seedHex)
  }
}

genSeedhex('legend trust army surround organ clinic man impose arrow language island can')
genSeedhex()
