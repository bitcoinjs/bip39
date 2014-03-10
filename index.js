Crypto = require('crypto-js')

module.exports = {
  mnemonicToSeed: mnemonicToSeed
}

function mnemonicToSeed(mnemonic, password){
  var options = {iterations: 2048, hasher: Crypto.algo.SHA512, keySize: 512/32}
  return Crypto.PBKDF2(mnemonic, salt(password), options).toString(Crypto.enc.Hex)
}

function salt(password) {
  return encode_utf8('mnemonic' + (password || ''))
}

function encode_utf8(s){
  return unescape(encodeURIComponent(s))
}
