var bip39 = require('../')
var download = require('../scripts/wordlists').download
var test = require('tape')

test('match wordlists against bitcoin/bips', function (t) {
  download(function (err, wordlists) {
    t.ifErr(err)

    wordlists.forEach(function (wordlist) {
      t.same(bip39.wordlists[wordlist.name], wordlist)
    })

    t.end()
  })
})
