var bip39 = require('../')
var test = require('tape')

test('seed derivation rejects non-string mnemonics', function (t) {
  var inputs = [undefined, null, false, true, 0, 1, NaN, [], {}, Buffer.from('abandon')]
  t.plan(inputs.length * 2)
  inputs.forEach(function (input) {
    t.throws(function () {
      bip39.mnemonicToSeedSync(input)
    }, /^TypeError: Invalid mnemonic$/, 'sync rejects ' + String(input))
    t.throws(function () {
      bip39.mnemonicToSeed(input)
    }, /^TypeError: Invalid mnemonic$/, 'async entry point rejects ' + String(input))
  })
})

test('seed derivation keeps non-strict string mnemonics', function (t) {
  var mnemonics = ['', 'basket actual', 'abandon  abandon', 'abandon\tabandon']
  t.plan(mnemonics.length * 2)
  mnemonics.forEach(function (mnemonic) {
    var expected = require('crypto').pbkdf2Sync(
      mnemonic.normalize('NFKD'), 'mnemonic', 2048, 64, 'sha512'
    )
    t.same(bip39.mnemonicToSeedSync(mnemonic), expected, 'sync accepts non-strict strings')
    bip39.mnemonicToSeed(mnemonic).then(function (seed) {
      t.same(seed, expected, 'async accepts non-strict strings')
    }).catch(t.fail)
  })
})
