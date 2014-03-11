var Crypto = require('crypto-js')
var Wordlists = require('require-json-tree')('./wordlists')

module.exports = BIP39

function BIP39(language){
  language = language || 'en'
  this.wordlist = Wordlists[language]
}

BIP39.prototype.mnemonicToSeed = function(mnemonic, password){
  var options = {iterations: 2048, hasher: Crypto.algo.SHA512, keySize: 512/32}
  return Crypto.PBKDF2(mnemonic, salt(password), options).toString(Crypto.enc.Hex)
}

function salt(password) {
  return encode_utf8('mnemonic' + (password || ''))
}

function encode_utf8(s){
  return unescape(encodeURIComponent(s))
}
