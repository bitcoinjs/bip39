var CryptoJS = require('crypto-js')
var path = require('path')
var includeFolder = require('include-folder')
var Wordlists = includeFolder(path.join(__dirname, 'wordlists'))
var crypto = require('crypto')

module.exports = BIP39

function BIP39(language) {
  language = language || 'en'
  this.wordlist = JSON.parse(Wordlists[language])
}

BIP39.prototype.mnemonicToSeed = function(mnemonic, password) {
  var options = {iterations: 2048, hasher: CryptoJS.algo.SHA512, keySize: 512/32}
  return CryptoJS.PBKDF2(mnemonic, salt(password), options).toString(CryptoJS.enc.Hex)
}

BIP39.prototype.entropyToMnemonic = function(entropy) {
  var entropyBuffer = new Buffer(entropy, 'hex')
  var hash = crypto.createHash('sha256').update(entropyBuffer).digest()

  var combined = Buffer.concat([entropyBuffer, hash])
  var bitLength = entropyBuffer.length * 8 + entropyBuffer.length / 4
  var bits = bytesToBinary([].slice.call(combined)).substr(0, bitLength)

  var chunks = (bits).match(/(.{1,11})/g)
  return chunks.map(function(binary) {
    var index = parseInt(binary, 2)
    return this.wordlist[index]
  }, this).join(' ')
}

BIP39.prototype.generateMnemonic = function(strength) {
  strength = strength || 128
  var entropy = crypto.randomBytes(strength/8).toString('hex')
  return this.entropyToMnemonic(entropy)
}

BIP39.prototype.validate = function(mnemonic) {
  mnemonic = mnemonic.split(' ')

  if (mnemonic.length % 3 !== 0) return false

  var wordlist = this.wordlist
  var belongToList = mnemonic.reduce(function(memo, m) {
    return memo && (wordlist.indexOf(m) > -1)
  }, true)

  if (!belongToList) return false

  var bits = mnemonic.map(function(m) {
    var id = wordlist.indexOf(m)
    return lpad(id.toString(2), '0', 11)
  }).join('')

  var length = bits.length
  var dividerIndex = Math.floor(length / 33) * 32
  var checksum = bits.substring(dividerIndex)

  var data = bits.substring(0, dividerIndex)
  var bytes = data.match(/(.{1,8})/g).map(function(bin) {
    return parseInt(bin, 2)
  })
  var hash = crypto.createHash('sha256').update(new Buffer(bytes)).digest()
  var checksumBits = bytesToBinary([].slice.call(hash))
  var checksum2 = checksumBits.substr(0, length - dividerIndex)

  return checksum === checksum2
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

