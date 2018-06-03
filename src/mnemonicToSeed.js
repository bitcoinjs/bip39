// use unorm until String.prototype.normalize gets better browser support
var Buffer = require('safe-buffer').Buffer
var unorm = require('unorm')
var pbkdf2 = require('pbkdf2').pbkdf2Sync
var salt = require('./salt')

function mnemonicToSeed (mnemonic, password) {
  var mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8')
  var saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8')

  return pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512')
}

module.exports = mnemonicToSeed
