var vectors = require('./vectors.json').english
var bip39 = require('../index.js')
var assert = require('assert')

describe('mnemonicToSeed', function(){
  vectors.forEach(function(v, i){
    it('works for tests vector ' + i, function(){
      assert.equal(bip39.mnemonicToSeed(v[1], 'TREZOR'), v[2])
    })
  })
})
