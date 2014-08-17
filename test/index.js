var assert = require('assert')
var BIP39 = require('../index.js')

var wordlists = {
  english: require('../wordlists/en.json'),
  custom: require('./wordlist.json')
}

var vectors = require('./vectors.json')

describe('BIP39', function() {
  describe('constructor', function() {
    it('defaults language to english', function() {
      var bip39 = new BIP39()
      assert.deepEqual(bip39.wordlist, wordlists.english)
    })

    it('accepts a custom wordlist', function() {
      var bip39 = new BIP39(wordlists.custom)
      assert.deepEqual(bip39.wordlist, wordlists.custom)
    })
  })

  describe('mnemonicToSeed', function() {
    this.timeout(20000)

    var bip39
    beforeEach(function() {
      bip39 = new BIP39()
    })

    vectors.english.forEach(function(v, i) {
      it('works for tests vector ' + i, function() {
        assert.equal(bip39.mnemonicToSeed(v[1], 'TREZOR'), v[2])
      })
    })
  })

  describe('entropyToMnemonic', function() {
    vectors.english.forEach(function(v, i) {
      it('works for tests vector ' + i, function() {
        var bip39 = new BIP39()
        assert.equal(bip39.entropyToMnemonic(v[0]), v[1])
      })
    })

    vectors.custom.forEach(function(v, i) {
      it('works for custom test vector ' + i, function() {
        var bip39 = new BIP39(wordlists.custom)
        assert.equal(bip39.entropyToMnemonic(v[0]), v[1])
      })
    })
  })

  describe('generateMnemonic', function() {
    it('generates a mnemonic', function() {
      var bip39 = new BIP39()
      var mnemonic = bip39.generateMnemonic(96)
      var words = mnemonic.split(' ')

      assert.equal(words.length, 9)
    })

    it('allows a custom RNG to be used', function() {
      var rng = function(size) {
        var buffer = new Buffer(size)
        buffer.fill(4) // guaranteed random
        return buffer
      }
      var bip39 = new BIP39()

      var mnemonic = bip39.generateMnemonic(64, rng)
      assert.equal(mnemonic, 'advice cage absurd amount doctor act')
    })

    it('adheres to a custom wordlist', function() {
      var rng = function(size) {
        var buffer = new Buffer(size)
        buffer.fill(4) // guaranteed random
        return buffer
      }

      var bip39 = new BIP39(wordlists.custom)
      var mnemonic = bip39.generateMnemonic(64, rng)
      assert.equal(mnemonic, 'adv1c3 cag3 ab5urd am0unt d0ct0r act')
    })
  })

  describe('validateMnemonic', function() {
    vectors.english.forEach(function(v, i) {
      var bip39 = new BIP39()

      it('passes check ' + i, function() {
        assert(bip39.validateMnemonic(v[1]))
      })
    })

    describe('with a custom wordlist', function() {
      vectors.custom.forEach(function(v, i) {
        var bip39 = new BIP39(wordlists.custom)

        it('passes custom check ' + i, function() {
          assert(bip39.validateMnemonic(v[1]))
        })
      })
    })

    it('fails for mnemonics of wrong length', function() {
      var bip39 = new BIP39()
      assert(!bip39.validateMnemonic('sleep kitten'))
      assert(!bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten'))
    })

    it('fails for mnemonics that contains words not from the word list', function() {
      var bip39 = new BIP39()
      assert(!bip39.validateMnemonic("turtle front uncle idea crush write shrug there lottery flower risky shell"))
    })

    it('fails for mnemonics of invalid checksum', function() {
      var bip39 = new BIP39()
      assert(!bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten'))
    })
  })
})
