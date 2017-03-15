var bip39 = require('../')
var proxyquire = require('proxyquire')
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

  test('for ' + description + ' test vector ' + i, function (t) {
    t.plan(5)

    t.equal(bip39.mnemonicToEntropy(vmnemonic, wordlist), ventropy, 'mnemonicToEntropy returns ' + ventropy.slice(0, 40) + '...')
    t.equal(bip39.mnemonicToSeedHex(vmnemonic, password), vseedHex, 'mnemonicToSeedHex returns ' + vseedHex.slice(0, 40) + '...')

    t.equal(bip39.entropyToMnemonic(ventropy, wordlist), vmnemonic, 'entropyToMnemonic returns ' + vmnemonic.slice(0, 40) + '...')

    function rng () { return new Buffer(ventropy, 'hex') }
    t.equal(bip39.generateMnemonic(undefined, rng, wordlist), vmnemonic, 'generateMnemonic returns RNG entropy unmodified')
    t.equal(bip39.validateMnemonic(vmnemonic, wordlist), true, 'validateMnemonic returns true')
  })
}

vectors.english.forEach(function (v, i) { testVector('English', undefined, 'TREZOR', v, i) })
vectors.japanese.forEach(function (v, i) { testVector('Japanese', WORDLISTS.japanese, '㍍ガバヴァぱばぐゞちぢ十人十色', v, i) })
vectors.custom.forEach(function (v, i) { testVector('Custom', WORDLISTS.custom, undefined, v, i) })

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

test('README example 1', function (t) {
  // defaults to BIP39 English word list
  var entropy = '133755ff'
  var mnemonic = bip39.entropyToMnemonic(entropy)

  t.plan(2)
  t.equal(mnemonic, 'basket rival lemon')

  // reversible
  t.equal(bip39.mnemonicToEntropy(mnemonic), entropy)
})

test('README example 2', function (t) {
  var stub = {
    randombytes: function (size) {
      return new Buffer('qwertyuiopasdfghjklzxcvbnm[];,./'.slice(0, size))
    }
  }
  var proxiedbip39 = proxyquire('../', stub)

  // mnemonic strength defaults to 128 bits
  var mnemonic = proxiedbip39.generateMnemonic()

  t.plan(2)
  t.equal(mnemonic, 'imitate robot frame trophy nuclear regret saddle around inflict case oil spice')
  t.equal(bip39.validateMnemonic(mnemonic), true)
})

test('README example 3', function (t) {
  var mnemonic = 'basket actual'
  var seed = bip39.mnemonicToSeed(mnemonic)
  var seedHex = bip39.mnemonicToSeedHex(mnemonic)

  t.plan(3)
  t.equal(seed.toString('hex'), seedHex)
  t.equal(seedHex, '5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f')
  t.equal(bip39.validateMnemonic(mnemonic), false)
})

test('generateMnemonic can vary entropy length', function (t) {
  var words = bip39.generateMnemonic(96).split(' ')

  t.plan(1)
  t.equal(words.length, 9, 'can vary generated entropy bit length')
})

test('generateMnemonic only requests the exact amount of data from an RNG', function (t) {
  t.plan(1)

  bip39.generateMnemonic(96, function (size) {
    t.equal(size, 96 / 8)
    return new Buffer(size)
  })
})

test('validateMnemonic', function (t) {
  t.plan(4)

  t.equal(bip39.validateMnemonic('sleep kitten'), false, 'fails for a mnemonic that is too short')
  t.equal(bip39.validateMnemonic('sleep kitten sleep kitten sleep kitten'), false, 'fails for a mnemonic that is too short')
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
