var vectors = require('./vectors.json').english
var BIP39 = require('../index.js')
var wordlist = require('../Wordlists/en.json')
var assert = require('assert')

describe('constructor', function(){
  it('defaults language to english', function(){
    var bip39 = new BIP39()
    assert.deepEqual(bip39.wordlist, wordlist)
  })
})

describe('mnemonicToSeed', function(){
  vectors.forEach(function(v, i){
    it('works for tests vector ' + i, function(){
      var bip39 = new BIP39()
      assert.equal(bip39.mnemonicToSeed(v[1], 'TREZOR'), v[2])
    })
  })
})
