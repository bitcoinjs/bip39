// use unorm until String.prototype.normalize gets better browser support
var unorm = require('unorm')
var Buffer = require('safe-buffer').Buffer
var DEFAULT_WORDLIST = require('./wordlists/english.json')
var ErrorConstants = require('./constants/ErrorConstants')
var lpad = require('./lpad')
var binaryToByte = require('./binaryToByte')
var deriveChecksumBits = require('./deriveChecksumBits')

function mnemonicToEntropy (mnemonic, wordlist) {
  wordlist = wordlist || DEFAULT_WORDLIST

  var words = unorm.nfkd(mnemonic).split(' ')
  if (words.length % 3 !== 0) throw new Error(ErrorConstants.INVALID_MNEMONIC)

  // convert word indices to 11 bit binary strings
  var bits = words.map(function (word) {
    var index = wordlist.indexOf(word)
    if (index === -1) throw new Error(ErrorConstants.INVALID_MNEMONIC)

    return lpad(index.toString(2), '0', 11)
  }).join('')

  // split the binary string into ENT/CS
  var dividerIndex = Math.floor(bits.length / 33) * 32
  var entropyBits = bits.slice(0, dividerIndex)
  var checksumBits = bits.slice(dividerIndex)

  // calculate the checksum and compare
  var entropyBytes = entropyBits.match(/(.{1,8})/g).map(binaryToByte)
  if (entropyBytes.length < 16) throw new Error(ErrorConstants.INVALID_ENTROPY)
  if (entropyBytes.length > 32) throw new Error(ErrorConstants.INVALID_ENTROPY)
  if (entropyBytes.length % 4 !== 0) throw new Error(ErrorConstants.INVALID_ENTROPY)

  var entropy = Buffer.from(entropyBytes)
  var newChecksum = deriveChecksumBits(entropy)
  if (newChecksum !== checksumBits) throw new Error(ErrorConstants.INVALID_CHECKSUM)

  return entropy.toString('hex')
}

module.exports = mnemonicToEntropy
