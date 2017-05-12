var createHash = require('create-hash')
var pbkdf2 = require('pbkdf2').pbkdf2Sync
var randomBytes = require('randombytes')

// use unorm until String.prototype.normalize gets better browser support
var unorm = require('unorm')

function lpad (str, padString, length) {
  while (str.length < length) str = padString + str
  return str
}

var ENGLISH_WORDLIST = require('./wordlists/english.json')
var FRENCH_WORDLIST = require('./wordlists/french.json')
var ITALIAN_WORDLIST = require('./wordlists/italian.json')
var JAPANESE_WORDLIST = require('./wordlists/japanese.json')
var SPANISH_WORDLIST = require('./wordlists/spanish.json')
var DEFAULT_WORDLIST = ENGLISH_WORDLIST

var INVALID_MNEMONIC = 'Invalid mnemonic'
var INVALID_ENTROPY = 'Invalid entropy'

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

function mnemonicToEntropy (mnemonic, wordlist) {
  wordlist = wordlist || DEFAULT_WORDLIST

  var words = unorm.nfkd(mnemonic).split(' ')
  if (words.length % 3 !== 0) throw new Error(INVALID_MNEMONIC)
  if (words.some(function (word) {
    return wordlist.indexOf(word) === -1
  })) throw new Error(INVALID_MNEMONIC)

  // convert word indices to 11 bit binary strings
  var bits = words.map(function (word) {
    var index = wordlist.indexOf(word)
    return lpad(index.toString(2), '0', 11)
  }).join('')

  if (bits.length < 128) throw new Error(INVALID_MNEMONIC)
  if (bits.length > 264) throw new Error(INVALID_MNEMONIC)

  // split the binary string into ENT/CS
  var dividerIndex = Math.floor(bits.length / 33) * 32
  var entropy = bits.slice(0, dividerIndex)
  var checksum = bits.slice(dividerIndex)

  // calculate the checksum and compare
  var entropyBytes = entropy.match(/(.{1,8})/g).map(function (bin) {
    return parseInt(bin, 2)
  })
  if (entropy.length % 4 !== 0) throw new TypeError(INVALID_ENTROPY)
  var entropyBuffer = new Buffer(entropyBytes)

  var newChecksum = checksumBits(entropyBuffer)
  if (newChecksum !== checksum) throw new Error('Invalid mnemonic checksum')

  return entropyBuffer.toString('hex')
}

function entropyToMnemonic (entropyHex, wordlist) {
  wordlist = wordlist || DEFAULT_WORDLIST

  // 128 <= ENT <= 256
  if (entropyHex.length < 32) throw new Error(INVALID_ENTROPY)
  if (entropyHex.length > 64) throw new Error(INVALID_ENTROPY)

  // multiple of 4
  if (entropyHex.length % 8 !== 0) throw new Error(INVALID_ENTROPY)

  var entropy = new Buffer(entropyHex, 'hex')
  var entropyBits = bytesToBinary([].slice.call(entropy))
  var checksum = checksumBits(entropy)

  var bits = entropyBits + checksum
  var chunks = bits.match(/(.{1,11})/g)

  var words = chunks.map(function (binary) {
    var index = parseInt(binary, 2)

    return wordlist[index]
  })

  return wordlist === JAPANESE_WORDLIST ? words.join('\u3000') : words.join(' ')
}

function generateMnemonic (strength, rng, wordlist) {
  strength = strength || 128
  if (strength % 32 !== 0) throw new TypeError(INVALID_ENTROPY)
  rng = rng || randomBytes

  var hex = rng(strength / 8).toString('hex')
  return entropyToMnemonic(hex, wordlist)
}

function validateMnemonic (mnemonic, wordlist) {
  try {
    mnemonicToEntropy(mnemonic, wordlist)
  } catch (e) {
    return false
  }

  return true
}

function bytesToBinary (bytes) {
  return bytes.map(function (x) {
    return lpad(x.toString(2), '0', 8)
  }).join('')
}

function checksumBits (entropyBuffer) {
  var hash = createHash('sha256').update(entropyBuffer).digest()

  // Calculated constants from BIP39
  var ENT = entropyBuffer.length * 8
  var CS = ENT / 32

  return bytesToBinary([].slice.call(hash)).slice(0, CS)
}

module.exports = {
  mnemonicToSeed: mnemonicToSeed,
  mnemonicToSeedHex: mnemonicToSeedHex,
  mnemonicToEntropy: mnemonicToEntropy,
  entropyToMnemonic: entropyToMnemonic,
  generateMnemonic: generateMnemonic,
  validateMnemonic: validateMnemonic,
  wordlists: {
    EN: ENGLISH_WORDLIST,
    JA: JAPANESE_WORDLIST,

    english: ENGLISH_WORDLIST,
    french: FRENCH_WORDLIST,
    italian: ITALIAN_WORDLIST,
    japanese: JAPANESE_WORDLIST,
    spanish: SPANISH_WORDLIST
  }
}
