var assert = require('assert')
var wordlist = require('../wordlists/en.json')
var vectors = require('./vectors.json').english

var BIP39 = require('../index.js')
var bip39 = new BIP39()

describe('constructor', function() {
  it('defaults language to english', function() {
    assert.deepEqual(bip39.wordlist, wordlist)
  })
})

describe('mnemonicToSeed', function() {
  vectors.forEach(function(v, i) {
    it('works for tests vector ' + i, function() {
      assert.equal(bip39.mnemonicToSeed(v[1], 'TREZOR'), v[2])
    })
  })
})

describe('entropyToMnemonic', function() {
  vectors.forEach(function(v, i) {
    it('works for tests vector ' + i, function() {
      assert.equal(bip39.entropyToMnemonic(v[0]), v[1])
    })
  })
})

describe('generateMnemonic', function() {
  it('generates a mnemonic', function() {
    var mnemonic = bip39.generateMnemonic(96)
    var words = mnemonic.split(' ')

    assert.equal(words.length, 9)
  })

  it('allows a custom RNG to be used', function() {
    var rng = {
      randomBuffer: function(size) {
        var buffer = new Buffer(size)
        buffer.fill(4) // guaranteed random
        return buffer
      }
    }

    var mnemonic = bip39.generateMnemonic(64, rng)
    assert.equal(mnemonic, 'advice cage absurd amount doctor act')
  })
})

describe('validate', function() {
  vectors.forEach(function(v, i) {
    it('passes check ' + i, function() {
      assert(bip39.validate(v[1]))
    })
  })

  it('fails for mnemonics of wrong length', function() {
    assert(!bip39.validate('sleep kitten'))
    assert(!bip39.validate('sleep kitten sleep kitten sleep kitten'))
  })

  it('fails for mnemonics that contains words not from the word list', function() {
    assert(!bip39.validate("turtle front uncle idea crush write shrug there lottery flower risky shell"))
  })

  it('fails for mnemonics of invalid checksum', function() {
    assert(!bip39.validate('sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten'))
  })
})
