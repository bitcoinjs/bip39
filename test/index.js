var assert = require('assert')
var crypto = require('crypto')
var BIP39 = require('../index.js')
var sinon = require('sinon')

var wordlists = {
  english: require('../wordlists/en.json'),
  custom: require('./wordlist.json')
}

var vectors = require('./vectors.json')

describe('BIP39', function() {
  describe('mnemonicToSeedHex', function() {
    this.timeout(20000)

    vectors.english.forEach(function(v, i) {
      it('works for tests vector ' + i, function() {
        assert.equal(BIP39.mnemonicToSeedHex(v[1], 'TREZOR'), v[2])
      })
    })
  })

  describe('mnemonicToEntropy', function() {
    vectors.english.forEach(function(v, i) {
      it('works for tests vector ' + i, function() {
        assert.equal(BIP39.mnemonicToEntropy(v[1]), v[0])
      })
    })

    vectors.custom.forEach(function(v, i) {
      it('works for custom test vector ' + i, function() {
        assert.equal(BIP39.mnemonicToEntropy(v[1], wordlists.custom), v[0])
      })
    })
  })

  describe('entropyToMnemonic', function() {
    vectors.english.forEach(function(v, i) {
      it('works for tests vector ' + i, function() {
        assert.equal(BIP39.entropyToMnemonic(v[0]), v[1])
      })
    })

    vectors.custom.forEach(function(v, i) {
      it('works for custom test vector ' + i, function() {
        assert.equal(BIP39.entropyToMnemonic(v[0], wordlists.custom), v[1])
      })
    })
  })

  describe('generateMnemonic', function() {
    vectors.english.forEach(function(v, i) {
      it('works for tests vector ' + i, sinon.test(function() {
        this.mock(crypto).expects('randomBytes')
          .exactly(1)
          .onCall(0).returns(new Buffer(v[0], 'hex'))

        assert.equal(BIP39.generateMnemonic(), v[1])
      }))
    })

    it('can vary generated entropy bit length', function() {
      var mnemonic = BIP39.generateMnemonic(96)
      var words = mnemonic.split(' ')

      assert.equal(words.length, 9)
    })

    it('allows a custom RNG to be used', function() {
      var rng = function(size) {
        var buffer = new Buffer(size)
        buffer.fill(4) // guaranteed random
        return buffer
      }

      var mnemonic = BIP39.generateMnemonic(64, rng)
      assert.equal(mnemonic, 'advice cage absurd amount doctor act')
    })

    it('adheres to a custom wordlist', function() {
      var rng = function(size) {
        var buffer = new Buffer(size)
        buffer.fill(4) // guaranteed random
        return buffer
      }

      var mnemonic = BIP39.generateMnemonic(64, rng, wordlists.custom)
      assert.equal(mnemonic, 'adv1c3 cag3 ab5urd am0unt d0ct0r act')
    })
  })

  describe('validateMnemonic', function() {
    vectors.english.forEach(function(v, i) {

      it('passes check ' + i, function() {
        assert(BIP39.validateMnemonic(v[1]))
      })
    })

    describe('with a custom wordlist', function() {
      vectors.custom.forEach(function(v, i) {

        it('passes custom check ' + i, function() {
          assert(BIP39.validateMnemonic(v[1], wordlists.custom))
        })
      })
    })

    it('fails for mnemonics of wrong length', function() {
      assert(!BIP39.validateMnemonic('sleep kitten'))
      assert(!BIP39.validateMnemonic('sleep kitten sleep kitten sleep kitten'))
    })

    it('fails for mnemonics that contains words not from the word list', function() {
      assert(!BIP39.validateMnemonic("turtle front uncle idea crush write shrug there lottery flower risky shell"))
    })

    it('fails for mnemonics of invalid checksum', function() {
      assert(!BIP39.validateMnemonic('sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten'))
    })
  })

  describe('utf8 passwords', function() {
    vectors.japanese.forEach(function(v, i) {
      it ('creates the correct seed', function() {
        var utf8_password = "㍍ガバヴァぱばぐゞちぢ十人十色"
        assert.equal(BIP39.mnemonicToSeedHex(v[1], utf8_password), v[2])
      })

      it ('works with already normalized password', function() {
        var normalized_password = "メートルガバヴァぱばぐゞちぢ十人十色"
        assert.equal(BIP39.mnemonicToSeedHex(v[1], normalized_password), v[2])
      })
    })
  })
})
