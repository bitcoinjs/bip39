var Buffer = require('safe-buffer').Buffer
var DEFAULT_WORDLIST = require('./wordlists/english.json')
var JAPANESE_WORDLIST = require('./wordlists/japanese.json')
var ErrorConstants = require('./constants/ErrorConstants')
var deriveChecksumBits = require('./deriveChecksumBits')
var bytesToBinary = require('./bytesToBinary')
var binaryToByte = require('./binaryToByte')

function entropyToMnemonic (entropy, wordlist) {
  if (!Buffer.isBuffer(entropy)) entropy = Buffer.from(entropy, 'hex')
  wordlist = wordlist || DEFAULT_WORDLIST

  // 128 <= ENT <= 256
  if (entropy.length < 16) throw new TypeError(ErrorConstants.INVALID_ENTROPY)
  if (entropy.length > 32) throw new TypeError(ErrorConstants.INVALID_ENTROPY)
  if (entropy.length % 4 !== 0) throw new TypeError(ErrorConstants.INVALID_ENTROPY)

  var entropyBits = bytesToBinary([].slice.call(entropy))
  var checksumBits = deriveChecksumBits(entropy)

  var bits = entropyBits + checksumBits
  var chunks = bits.match(/(.{1,11})/g)
  var words = chunks.map(function (binary) {
    var index = binaryToByte(binary)
    return wordlist[index]
  })

  return wordlist === JAPANESE_WORDLIST ? words.join('\u3000') : words.join(' ')
}

module.exports = entropyToMnemonic
