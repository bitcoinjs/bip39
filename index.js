var CryptoJS = require('crypto-js')
var crypto = require('crypto')
var secureRandom = require('secure-random')

var includeFolder = require('include-folder')
var path = require('path')
var wordlists = includeFolder(path.join(__dirname, 'wordlists'))

function BIP39(language) {
  language = language || 'en'
  this.wordlist = JSON.parse(wordlists[language])
}

BIP39.prototype.mnemonicToSeed = function(mnemonic, password) {
  var options = {iterations: 2048, hasher: CryptoJS.algo.SHA512, keySize: 512/32}
  return CryptoJS.PBKDF2(mnemonic, salt(password), options).toString(CryptoJS.enc.Hex)
}

BIP39.prototype.entropyToMnemonic = function(entropy) {
  var entropyBuffer = new Buffer(entropy, 'hex')
  var entropyBits = bytesToBinary([].slice.call(entropyBuffer))
  var checksum = checksumBits(entropyBuffer)

  var bits = entropyBits + checksum
  var chunks = bits.match(/(.{1,11})/g)

  var words = chunks.map(function(binary) {
    var index = parseInt(binary, 2)

    return this.wordlist[index]
  }, this)

  return words.join(' ')
}

BIP39.prototype.generateMnemonic = function(strength, rng) {
  strength = strength || 128
  rng = rng || secureRandom

  var hex = rng.randomBuffer(strength / 8).toString('hex')
  return this.entropyToMnemonic(hex)
}

BIP39.prototype.validate = function(mnemonic) {
  var words = mnemonic.split(' ')

  if (words.length % 3 !== 0) return false

  var wordlist = this.wordlist
  var belongToList = words.every(function(word) {
    return wordlist.indexOf(word) > -1
  })

  if (!belongToList) return false

  // convert word indices to 11 bit binary strings
  var bits = words.map(function(word) {
    var index = wordlist.indexOf(word)
    return lpad(index.toString(2), '0', 11)
  }).join('')

  // split the binary string into ENT/CS
  var dividerIndex = Math.floor(bits.length / 33) * 32
  var entropy = bits.slice(0, dividerIndex)
  var checksum = bits.slice(dividerIndex)

  // calculate the checksum and compare
  var entropyBytes = entropy.match(/(.{1,8})/g).map(function(bin) {
    return parseInt(bin, 2)
  })
  var entropyBuffer = new Buffer(entropyBytes)
  var newChecksum = checksumBits(entropyBuffer)

  return newChecksum === checksum
}

function checksumBits(entropyBuffer) {
  var hash = crypto.createHash('sha256').update(entropyBuffer).digest()

  // Calculated constants from BIP39
  var ENT = entropyBuffer.length * 8
  var CS = ENT / 32

  return bytesToBinary([].slice.call(hash)).slice(0, CS)
}

function salt(password) {
  return encode_utf8('mnemonic' + (password || ''))
}

function encode_utf8(s) {
  return unescape(encodeURIComponent(s))
}

//=========== helper methods from bitcoinjs-lib ========

function bytesToBinary(bytes) {
  return bytes.map(function(x) {
    return lpad(x.toString(2), '0', 8)
  }).join('');
}

function lpad(str, padString, length) {
  while (str.length < length) str = padString + str;
  return str;
}

module.exports = BIP39
