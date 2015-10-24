var assert = require('assert')
var createHash = require('create-hash')
var pbkdf2 = require('pbkdf2').pbkdf2Sync
var randomBytes = require('randombytes')
var typeforce = require('typeforce')

// use unorm until String.prototype.normalize gets better browser support
var unorm = require('unorm')

function salt (password) {
  return 'mnemonic' + (password || '')
}

function mnemonicToSeed (mnemonic, password) {
  var mnemonicBuffer = new Buffer(unorm.nfkd(mnemonic), 'utf8')
  var saltBuffer = new Buffer(salt(unorm.nfkd(password)), 'utf8')

  return pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
}

function mnemonicToSeedHex (mnemonic, password) {
  return mnemonicToSeed(mnemonic, password).toString('hex')
}

/**
 * Converts a mnemonic from the specified wordlist to entropy
 * @param {string} mnemonic - required
 * @param {array} wordlist - required, an array of strings
 */
function mnemonicToEntropy (mnemonic, wordlist) {
  typeforce(typeforce.String, mnemonic)
  typeforce(typeforce.arrayOf(typeforce.String), wordlist)

  var words = unorm.nfkd(mnemonic).split(' ')
  assert(words.length % 3 === 0, 'Invalid mnemonic')

  var belongToList = words.every(function (word) {
    return wordlist.indexOf(word) > -1
  })

  assert(belongToList, 'Invalid mnemonic')

  // convert word indices to 11 bit binary strings
  var bits = words.map(function (word) {
    var index = wordlist.indexOf(word)
    return lpad(index.toString(2), '0', 11)
  }).join('')

  // split the binary string into ENT/CS
  var dividerIndex = Math.floor(bits.length / 33) * 32
  var entropy = bits.slice(0, dividerIndex)
  var checksum = bits.slice(dividerIndex)

  // calculate the checksum and compare
  var entropyBytes = entropy.match(/(.{1,8})/g).map(function (bin) {
    return parseInt(bin, 2)
  })
  var entropyBuffer = new Buffer(entropyBytes)
  var newChecksum = checksumBits(entropyBuffer)

  assert(newChecksum === checksum, 'Invalid mnemonic checksum')

  return entropyBuffer.toString('hex')
}

/**
 * Converts entropy to a mnemonic with words from the supplied wordlist, separated by the supplied delimiter
 * @param {string} entropy - required, in hex string
 * @param {array} wordlist - required, an array of strings
 * @param {string} delimiter - optional, default to ' '. This needs to be explicitly specified to '\u3000' when a Japanese wordlist is used.
 */
function entropyToMnemonic (entropy, wordlist, delimiter) {
  //TODO(weilu): better error messages
  typeforce('String', entropy)
  typeforce(typeforce.arrayOf('String'), wordlist)
  typeforce('?String', delimiter)

  delimiter = delimiter || ' '

  var entropyBuffer = new Buffer(entropy, 'hex')
  var entropyBits = bytesToBinary([].slice.call(entropyBuffer))
  var checksum = checksumBits(entropyBuffer)

  var bits = entropyBits + checksum
  var chunks = bits.match(/(.{1,11})/g)

  var words = chunks.map(function (binary) {
    var index = parseInt(binary, 2)

    return wordlist[index]
  })

  return words.join(delimiter)
}

/**
 * Derive a mnemonic using the specified wordlist from a generated entropy. If the random number generator function is specified, use it.
 * @param {array} wordlist - required, an array of strings
 * @param {number} strength - optional, default to 128. Entropy bit length
 * @param {function} rng - optional, default to crypto.randomBytes in node and .crypto/msCrypto.getRandomValues in browsers.
 * @param {string} delimiter - optional, default to ' '. This needs to be explicitly specified to '\u3000' when a Japanese wordlist is used.
 */
function generateMnemonic (wordlist, strength, rng, delimiter) {
  typeforce(typeforce.arrayOf(typeforce.String), wordlist)
  typeforce(typeforce.maybe(typeforce.Number), strength)
  typeforce(typeforce.maybe(typeforce.Function), rng)

  strength = strength || 128
  rng = rng || randomBytes

  var hex = rng(strength / 8).toString('hex')
  return entropyToMnemonic(hex, wordlist, delimiter)
}

/**
 * Validate a mnemonic against the specified wordlist
 * @param {string} mnemonic - required
 * @param {array} wordlist - required, an array of strings
 */
function validateMnemonic (mnemonic, wordlist) {
  typeforce(typeforce.String, mnemonic)
  typeforce(typeforce.arrayOf(typeforce.String), wordlist)

  try {
    mnemonicToEntropy(mnemonic, wordlist)
  } catch (e) {
    return false
  }

  return true
}

function checksumBits (entropyBuffer) {
  var hash = createHash('sha256').update(entropyBuffer).digest()

  // Calculated constants from BIP39
  var ENT = entropyBuffer.length * 8
  var CS = ENT / 32

  return bytesToBinary([].slice.call(hash)).slice(0, CS)
}

// =========== helper methods from bitcoinjs-lib ========

function bytesToBinary (bytes) {
  return bytes.map(function (x) {
    return lpad(x.toString(2), '0', 8)
  }).join('')
}

function lpad (str, padString, length) {
  while (str.length < length) str = padString + str
  return str
}

module.exports = {
  mnemonicToSeed: mnemonicToSeed,
  mnemonicToSeedHex: mnemonicToSeedHex,
  mnemonicToEntropy: mnemonicToEntropy,
  entropyToMnemonic: entropyToMnemonic,
  generateMnemonic: generateMnemonic,
  validateMnemonic: validateMnemonic
}
