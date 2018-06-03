var randomBytes = require('randombytes')
var entropyToMnemonic = require('./entropyToMnemonic')
var ErrorConstants = require('./constants/ErrorConstants')

function generateMnemonic (strength, rng, wordlist) {
  strength = strength || 128
  if (strength % 32 !== 0) throw new TypeError(ErrorConstants.INVALID_ENTROPY)
  rng = rng || randomBytes

  return entropyToMnemonic(rng(strength / 8), wordlist)
}

module.exports = generateMnemonic
