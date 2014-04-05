var Crypto = require('crypto-js')
var path = require('path')
var includeFolder = require('include-folder')
var Wordlists = includeFolder(path.join(__dirname, 'wordlists'))
var randomBytes = require('crypto').randomBytes

module.exports = BIP39

function BIP39(language){
  language = language || 'en'
  this.wordlist = JSON.parse(Wordlists[language])
}

BIP39.prototype.mnemonicToSeed = function(mnemonic, password){
  var options = {iterations: 2048, hasher: Crypto.algo.SHA512, keySize: 512/32}
  return Crypto.PBKDF2(mnemonic, salt(password), options).toString(Crypto.enc.Hex)
}

BIP39.prototype.entropyToMnemonic = function(entropy){
  var entropyBytes = hexToBytes(entropy)
  var bits = bytesToBinary(entropyBytes)

  var hash = Crypto.SHA256(bytesToWordArray(entropyBytes))
  var checksumBits = bytesToBinary(wordsToBytes(hash.words))
  var checksum = checksumBits.substr(0, bits.length / 32)

  var chunks = (bits + checksum).match(/(.{1,11})/g)
  return chunks.map(function(binary){
    var index = parseInt(binary, 2)
    return this.wordlist[index]
  }, this).join(' ')
}

BIP39.prototype.generateMnemonic = function(strength){
  strength = strength || 128
  var entropy = randomBytes(strength/8).toString('hex')
  return this.entropyToMnemonic(entropy)
}

BIP39.prototype.validate = function(mnemonic){
  mnemonic = mnemonic.split(' ')

  if(mnemonic.length % 3 !== 0) return false

  var wordlist = this.wordlist
  var belongToList = mnemonic.reduce(function(memo, m){
    return memo && (wordlist.indexOf(m) > -1)
  }, true)

  if(!belongToList) return false

  var bits = mnemonic.map(function(m){
    var id = wordlist.indexOf(m)
    return lpad(id.toString(2), '0', 11)
  }).join('')

  var length = bits.length
  var dividerIndex = Math.floor(length / 33) * 32
  var checksum = bits.substring(dividerIndex)

  var data = bits.substring(0, dividerIndex)
  var bytes = data.match(/(.{1,8})/g).map(function(bin){
    return parseInt(bin, 2)
  })
  var hash = Crypto.SHA256(bytesToWordArray(bytes))
  var checksumBits = bytesToBinary(wordsToBytes(hash.words))
  var checksum2 = checksumBits.substr(0, length - dividerIndex)

  return checksum === checksum2
}

function salt(password) {
  return encode_utf8('mnemonic' + (password || ''))
}

function encode_utf8(s){
  return unescape(encodeURIComponent(s))
}

//=========== helper methods from bitcoinjs-lib ========

function hexToBytes(hex) {
  return hex.match(/../g).map(function(x) {
    return parseInt(x,16)
  });
}

function bytesToBinary(bytes) {
  return bytes.map(function(x) {
    return lpad(x.toString(2), '0', 8)
  }).join('');
}

function bytesToWordArray(bytes) {
  return new Crypto.lib.WordArray.init(bytesToWords(bytes), bytes.length)
}

function bytesToWords(bytes) {
    var words = [];
    for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
        words[b >>> 5] |= bytes[i] << (24 - b % 32);
    }
    return words;
}

function wordsToBytes(words) {
    var bytes = [];
    for (var b = 0; b < words.length * 32; b += 8) {
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
    }
    return bytes;
}

function lpad(str, padString, length) {
  while (str.length < length) str = padString + str;
  return str;
}

