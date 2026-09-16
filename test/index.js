var bip39 = require('../')
var download = require('../util/wordlists').download
var WORDLISTS = {
  english: require('../src/wordlists/english.json'),
  japanese: require('../src/wordlists/japanese.json'),
  custom: require('./wordlist.json')
}

var vectors = require('./vectors.json')
var test = require('tape')

function testVector (description, wordlist, password, v, i) {
  var ventropy = v[0]
  var vmnemonic = v[1]
  var vseedHex = v[2]

  test('for ' + description + '(' + i + '), ' + ventropy, function (t) {
    t.plan(6)

    t.equal(bip39.mnemonicToEntropy(vmnemonic, wordlist), ventropy, 'mnemonicToEntropy returns ' + ventropy.slice(0, 40) + '...')
    t.equal(bip39.mnemonicToSeedSync(vmnemonic, password).toString('hex'), vseedHex, 'mnemonicToSeedSync returns ' + vseedHex.slice(0, 40) + '...')
    bip39.mnemonicToSeed(vmnemonic, password).then(function (asyncSeed) {
      t.equal(asyncSeed.toString('hex'), vseedHex, 'mnemonicToSeed returns ' + vseedHex.slice(0, 40) + '...')
    })
    t.equal(bip39.entropyToMnemonic(ventropy, wordlist), vmnemonic, 'entropyToMnemonic returns ' + vmnemonic.slice(0, 40) + '...')

    function rng () { return Buffer.from(ventropy, 'hex') }
    t.equal(bip39.generateMnemonic(undefined, rng, wordlist), vmnemonic, 'generateMnemonic returns RNG entropy unmodified')
    t.equal(bip39.validateMnemonic(vmnemonic, wordlist), true, 'validateMnemonic returns true')
  })
}

vectors.english.forEach(function (v, i) { testVector('English', undefined, 'TREZOR', v, i) })
vectors.japanese.forEach(function (v, i) { testVector('Japanese', WORDLISTS.japanese, '㍍ガバヴァぱばぐゞちぢ十人十色', v, i) })
vectors.custom.forEach(function (v, i) { testVector('Custom', WORDLISTS.custom, undefined, v, i) })

test('getDefaultWordlist returns "english"', function (t) {
  t.plan(1)
  const english = bip39.getDefaultWordlist()
  t.equal(english, 'english')
  // TODO: Test that Error throws when called if no wordlists are compiled with bip39
})

test('setDefaultWordlist changes default wordlist', function (t) {
  t.plan(4)
  const english = bip39.getDefaultWordlist()
  t.equal(english, 'english')

  bip39.setDefaultWordlist('italian')

  const italian = bip39.getDefaultWordlist()
  t.equal(italian, 'italian')

  const phraseItalian = bip39.entropyToMnemonic('00000000000000000000000000000000')
  t.equal(phraseItalian.slice(0, 5), 'abaco')

  bip39.setDefaultWordlist('english')

  const phraseEnglish = bip39.entropyToMnemonic('00000000000000000000000000000000')
  t.equal(phraseEnglish.slice(0, 7), 'abandon')
})

test('setDefaultWordlist throws on unknown wordlist', function (t) {
  t.plan(2)
  const english = bip39.getDefaultWordlist()
  t.equal(english, 'english')

  try {
    bip39.setDefaultWordlist('abcdefghijklmnop')
  } catch (error) {
    t.equal(error.message, 'Could not find wordlist for language "abcdefghijklmnop"')
    return
  }
  t.assert(false)
})

test('setDefaultWordlist accepts language names and aliases', function (t) {
  t.plan(4)

  try {
    bip39.setDefaultWordlist('italian')
    t.equal(bip39.getDefaultWordlist(), 'italian')

    bip39.setDefaultWordlist('english')
    t.equal(bip39.getDefaultWordlist(), 'english')

    bip39.setDefaultWordlist('EN')
    t.equal(bip39.getDefaultWordlist(), 'english')

    bip39.setDefaultWordlist('JA')
    t.equal(bip39.getDefaultWordlist(), 'japanese')
  } finally {
    bip39.setDefaultWordlist('english')
  }
})

test('setDefaultWordlist rejects inherited property names', function (t) {
  var inheritedNames = [
    '__proto__',
    'constructor',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__'
  ]
  t.plan(inheritedNames.length)

  try {
    inheritedNames.forEach(function (name) {
      bip39.setDefaultWordlist('english')
      t.throws(function () {
        bip39.setDefaultWordlist(name)
      }, new RegExp('^Error: Could not find wordlist for language "' + name + '"$'), 'rejects inherited "' + name + '"')
    })
  } finally {
    bip39.setDefaultWordlist('english')
  }
})

test('setDefaultWordlist rejection preserves mnemonic behavior', function (t) {
  var mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  t.plan(6)

  try {
    bip39.setDefaultWordlist('english')

    t.throws(function () {
      bip39.setDefaultWordlist('abcdefghijklmnop')
    }, /^Error: Could not find wordlist for language "abcdefghijklmnop"$/)
    t.equal(bip39.getDefaultWordlist(), 'english', 'ordinary rejection preserves the default')

    t.throws(function () {
      bip39.setDefaultWordlist('__proto__')
    }, /^Error: Could not find wordlist for language "__proto__"$/)
    t.equal(bip39.getDefaultWordlist(), 'english', 'inherited rejection preserves the default')

    var generated = bip39.generateMnemonic(128, function (size) {
      return Buffer.alloc(size)
    })
    t.equal(generated, mnemonic, 'generation still uses the preserved default')
    t.equal(bip39.validateMnemonic(generated), true, 'validation still uses the preserved default')
  } finally {
    bip39.setDefaultWordlist('english')
  }
})

test('invalid entropy', function (t) {
  t.plan(3)

  t.throws(function () {
    bip39.entropyToMnemonic(Buffer.from('', 'hex'))
  }, /^TypeError: Invalid entropy$/, 'throws for empty entropy')

  t.throws(function () {
    bip39.entropyToMnemonic(Buffer.from('000000', 'hex'))
  }, /^TypeError: Invalid entropy$/, 'throws for entropy that\'s not a multitude of 4 bytes')

  t.throws(function () {
    bip39.entropyToMnemonic(Buffer.from(new Array(1028 + 1).join('00'), 'hex'))
  }, /^TypeError: Invalid entropy$/, 'throws for entropy that is larger than 1024')
})

test('valid hex and Buffer entropy', function (t) {
  var byteLengths = [16, 20, 24, 28, 32]

  t.plan(byteLengths.length * 3 + 1)

  byteLengths.forEach(function (byteLength) {
    var entropy = new Array(byteLength + 1).join('ab')
    var mnemonic = bip39.entropyToMnemonic(entropy)

    t.equal(bip39.mnemonicToEntropy(mnemonic), entropy, 'round trips ' + byteLength + ' bytes of hex entropy')
    t.equal(bip39.mnemonicToEntropy(bip39.entropyToMnemonic(Buffer.from(entropy, 'hex'))), entropy, 'round trips ' + byteLength + ' bytes of Buffer entropy')
    t.equal(bip39.entropyToMnemonic(entropy.toUpperCase()), mnemonic, 'accepts uppercase hex entropy')
  })

  var entropy = new Array(16 + 1).join('ab')
  t.equal(bip39.entropyToMnemonic(entropy, WORDLISTS.custom), bip39.entropyToMnemonic(Buffer.from(entropy, 'hex'), WORDLISTS.custom), 'accepts valid hex with a custom wordlist')
})

test('invalid hex entropy', function (t) {
  var byteLengths = [16, 20, 24, 28, 32]
  var entropy = new Array(32 + 1).join('ab')

  t.plan(byteLengths.length + 3)

  byteLengths.forEach(function (byteLength) {
    var validPrefix = new Array(byteLength + 1).join('ab')
    t.throws(function () {
      bip39.entropyToMnemonic(validPrefix + 'X0')
    }, /^TypeError: Invalid entropy$/, 'rejects a malformed suffix after ' + byteLength + ' decoded bytes')
  })

  t.throws(function () {
    bip39.entropyToMnemonic(entropy.slice(0, 32) + ' ' + entropy.slice(33))
  }, /^TypeError: Invalid entropy$/, 'rejects embedded whitespace')

  t.throws(function () {
    bip39.entropyToMnemonic(entropy + 'a\n')
  }, /^TypeError: Invalid entropy$/, 'rejects a trailing line break')

  t.throws(function () {
    bip39.entropyToMnemonic(new Array(16 + 1).join('ab') + 'a')
  }, /^TypeError: Invalid entropy$/, 'rejects odd-length hex entropy')
})

test('UTF8 passwords', function (t) {
  t.plan(vectors.japanese.length * 2)

  vectors.japanese.forEach(function (v) {
    var vmnemonic = v[1]
    var vseedHex = v[2]

    var password = '㍍ガバヴァぱばぐゞちぢ十人十色'
    var normalizedPassword = 'メートルガバヴァぱばぐゞちぢ十人十色'

    t.equal(bip39.mnemonicToSeedSync(vmnemonic, password).toString('hex'), vseedHex, 'mnemonicToSeedSync normalizes passwords')
    t.equal(bip39.mnemonicToSeedSync(vmnemonic, normalizedPassword).toString('hex'), vseedHex, 'mnemonicToSeedSync leaves normalizes passwords as-is')
  })
})

test('generateMnemonic can vary entropy length', function (t) {
  var words = bip39.generateMnemonic(160).split(' ')

  t.plan(1)
  t.equal(words.length, 15, 'can vary generated entropy bit length')
})

test('generateMnemonic requests the exact amount of data from an RNG', function (t) {
  t.plan(1)

  bip39.generateMnemonic(160, function (size) {
    t.equal(size, 160 / 8)
    return Buffer.allocUnsafe(size)
  })
})

test('validateMnemonic', function (t) {
  t.plan(5)

  t.equal(bip39.validateMnemonic('sleep kitten'), false, 'fails for a mnemonic that is too short')
  t.equal(bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten'), false, 'fails for a mnemonic that is too short')
  t.equal(bip39.validateMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about end grace oxygen maze bright face loan ticket trial leg cruel lizard bread worry reject journey perfect chef section caught neither install industry'), false, 'fails for a mnemonic that is too long')
  t.equal(bip39.validateMnemonic('turtle front uncle idea crush write shrug there lottery flower risky shell'), false, 'fails if mnemonic words are not in the word list')
  t.equal(bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten'), false, 'fails for invalid checksum')
})

test('exposes standard wordlists', function (t) {
  t.plan(2)
  t.same(bip39.wordlists.EN, WORDLISTS.english)
  t.equal(bip39.wordlists.EN.length, 2048)
})

test('verify wordlists from https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md', function (t) {
  download().then(function (wordlists) {
    Object.keys(wordlists).forEach(function (name) {
      t.same(bip39.wordlists[name], wordlists[name])
    })

    t.end()
  })
})
