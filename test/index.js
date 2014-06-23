var assert = require('assert')
var wordlist = require('../wordlists/en.json')
var vectors = require('./vectors.json').english

var BIP39 = require('../index.js')
var bip39 = new BIP39()

describe('constructor', function(){
  it('defaults language to english', function(){
    assert.deepEqual(bip39.wordlist, wordlist)
  })
})

describe('mnemonicToSeed', function(){
  vectors.forEach(function(v, i){
    it('works for tests vector ' + i, function(){
      assert.equal(bip39.mnemonicToSeed(v[1], 'TREZOR'), v[2])
    })
  })
})

describe('entropyToMnemonic', function(){
  vectors.forEach(function(v, i){
    it('works for tests vector ' + i, function(){
      assert.equal(bip39.entropyToMnemonic(v[0]), v[1])
    })
  })
})

describe('validate', function(){
  vectors.forEach(function(v, i){
    it('passes check ' + i, function(){
      assert(bip39.validate(v[1]))
    })
  })

  it('fails for mnemonics of wrong length', function(){
    assert(!bip39.validate('sleep kitten'))
    assert(!bip39.validate('sleep kitten sleep kitten sleep kitten'))
  })

  it('fails for mnemonics that contains words not from the word list', function(){
    assert(!bip39.validate("turtle front uncle idea crush write shrug there lottery flower risky shell"))
  })

  it('fails for mnemonics of invalid checksum', function(){
    assert(!bip39.validate('sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten'))
  })
})
