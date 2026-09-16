var bip39 = require('../')
var Buffer = require('safe-buffer').Buffer
var download = require('../util/wordlists').download
var WORDLISTS = {
  english: require('../wordlists/english.json'),
  japanese: require('../wordlists/japanese.json'),
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
    t.equal(bip39.mnemonicToSeedHex(vmnemonic, password), vseedHex, 'mnemonicToSeedHex returns ' + vseedHex.slice(0, 40) + '...')
    bip39.mnemonicToSeedHexAsync(vmnemonic, password).then(function (asyncSeedHex) {
      t.equal(asyncSeedHex, vseedHex, 'mnemonicToSeedHexAsync returns ' + vseedHex.slice(0, 40) + '...')
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

test('invalid hex entropy', function (t) {
  var validSizes = [16, 20, 24, 28, 32]
  var entropy = Buffer.alloc(32, 0xab).toString('hex')

  t.plan(validSizes.length + 3)

  validSizes.forEach(function (size) {
    var invalidEntropy = entropy.slice(0, size * 2) + 'x' + entropy.slice(size * 2 + 1)
    t.throws(function () {
      bip39.entropyToMnemonic(invalidEntropy)
    }, /^TypeError: Invalid entropy$/, 'throws when invalid hex truncates to ' + size + ' bytes')
  })

  t.throws(function () {
    bip39.entropyToMnemonic(entropy.slice(0, 32) + 'a')
  }, /^TypeError: Invalid entropy$/, 'throws for odd-length hex')

  t.throws(function () {
    bip39.entropyToMnemonic(entropy.slice(0, 32) + ' ' + entropy.slice(32))
  }, /^TypeError: Invalid entropy$/, 'throws for spaces in hex')

  t.throws(function () {
    bip39.entropyToMnemonic(entropy.slice(0, 32) + '\n')
  }, /^TypeError: Invalid entropy$/, 'throws for trailing line breaks')
})

test('valid hex entropy', function (t) {
  var validSizes = [16, 20, 24, 28, 32]
  var entropy = Buffer.alloc(32, 0xab).toString('hex')

  t.plan(validSizes.length * 3 + 2)

  validSizes.forEach(function (size) {
    var entropyHex = entropy.slice(0, size * 2)
    var mnemonic = bip39.entropyToMnemonic(entropyHex)

    t.equal(bip39.mnemonicToEntropy(mnemonic), entropyHex, 'round trips ' + size + ' bytes of lowercase hex')
    t.equal(bip39.entropyToMnemonic(entropyHex.toUpperCase()), mnemonic, 'accepts ' + size + ' bytes of uppercase hex')
    t.equal(bip39.entropyToMnemonic(Buffer.from(entropyHex, 'hex')), mnemonic, 'accepts ' + size + ' byte Buffers')
  })

  var entropyHex = entropy.slice(0, 32)
  var customMnemonic = bip39.entropyToMnemonic(entropyHex, WORDLISTS.custom)
  var japaneseMnemonic = bip39.entropyToMnemonic(entropyHex, WORDLISTS.japanese)
  t.equal(bip39.mnemonicToEntropy(customMnemonic, WORDLISTS.custom), entropyHex, 'preserves custom wordlists')
  t.equal(bip39.mnemonicToEntropy(japaneseMnemonic, WORDLISTS.japanese), entropyHex, 'preserves Japanese wordlists')
})

test('UTF8 passwords', function (t) {
  t.plan(vectors.japanese.length * 2)

  vectors.japanese.forEach(function (v) {
    var vmnemonic = v[1]
    var vseedHex = v[2]

    var password = '㍍ガバヴァぱばぐゞちぢ十人十色'
    var normalizedPassword = 'メートルガバヴァぱばぐゞちぢ十人十色'

    t.equal(bip39.mnemonicToSeedHex(vmnemonic, password), vseedHex, 'mnemonicToSeedHex normalizes passwords')
    t.equal(bip39.mnemonicToSeedHex(vmnemonic, normalizedPassword), vseedHex, 'mnemonicToSeedHex leaves normalizes passwords as-is')
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
