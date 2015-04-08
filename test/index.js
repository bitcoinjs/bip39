var assert = require('assert')
var mock = require('mock-require')

mock('randombytes', function(size) {
  return new Buffer('qwertyuiopasdfghjklzxcvbnm[];,./'.slice(0, size))
})

var BIP39 = require('../index.js')

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
      it('works for tests vector ' + i, function() {
        function rng() { return new Buffer(v[0], 'hex') }

        assert.equal(BIP39.generateMnemonic(undefined, rng), v[1])
      })
    })

    it('can vary generated entropy bit length', function() {
      var mnemonic = BIP39.generateMnemonic(96)
      var words = mnemonic.split(' ')

      assert.equal(words.length, 9)
    })

    it('defaults to randombytes for the RNG', function() {
      assert.equal(BIP39.generateMnemonic(32), 'imitate robot frequent')
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
    vectors.japanese.forEach(function(v) {
      it ('creates the correct seed', function() {
        var utf8Password = "㍍ガバヴァぱばぐゞちぢ十人十色"
        assert.equal(BIP39.mnemonicToSeedHex(v[1], utf8Password), v[2])
      })

      it ('works with already normalized password', function() {
        var normalizedPassword = "メートルガバヴァぱばぐゞちぢ十人十色"
        assert.equal(BIP39.mnemonicToSeedHex(v[1], normalizedPassword), v[2])
      })
    })
  })

  describe('Examples in readme', function() {
    var bip39 = BIP39

    var mnemonic = bip39.entropyToMnemonic('133755ff') // hex input, defaults to BIP39 English word list
    // 'basket rival lemon'
    assert.ok((/^\w+ \w+ \w+$/).test(mnemonic))

    var temp = bip39.mnemonicToEntropy(mnemonic) // hex input, defaults to BIP39 English word list
    // '133755ff'
    assert.equal(temp, '133755ff')

    // Generate a random mnemonic using crypto.randomBytes
    mnemonic = bip39.generateMnemonic() // strength defaults to 128 bits
    //'bench maximum balance appear cousin negative muscle inform enjoy chief vocal hello'
    assert.ok(/^(\w+ ){11}\w+$/.test(mnemonic))

    var str = bip39.mnemonicToSeedHex('basket actual')
    //'5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f'
    assert.equal(str, '5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f')

    var buff = bip39.mnemonicToSeed('basket actual')
    var fiveC = 5*16+12
    assert.equal(buff[0], fiveC)
    // <Buffer 5c f2 d4 a8 b0 35 5e 90 29 5b df c5 65 a0 22 a4 09 af 06 3d 53 65 bb 57 bf 74 d9 52 8f 49 4b fa 44 00 f5 3d 83 49 b8 0f da e4 40 82 d7 f9 54 1e 1d ba 2b ...>

    var bool = bip39.validateMnemonic(mnemonic)
    // true
    assert.ok(bool)

    bool = bip39.validateMnemonic('basket actual')
    // false
    assert.ok(! bool)
  })
})
