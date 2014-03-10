var vectors = require('./vectors.json').english
var bip39 = require('../index.js')
var assert = require('assert')

describe('mnemonicToSeed', function(){
  it('works for tests vectors', function(){
    vectors.forEach(function(v){
      assert.equal(bip39.mnemonicToSeed(v[1], 'TREZOR'), v[2])
    })
  })
})
