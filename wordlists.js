var wordlistCache = {}
var wordlists = new Proxy({}, {
  get: function (target, name, receiver) {
    var lang = name
    if (name === 'EN') lang = 'english'
    if (name === 'JA') lang = 'japanese'
    if (wordlistCache[lang]) return wordlistCache[lang]
    try {
      wordlistCache[lang] = require('./wordlists/' + lang + '.json')
      if (name === 'EN' || name === 'JA') wordlistCache[name] = wordlistCache[lang]
      return wordlistCache[lang]
    } catch (err) {
      return wordlistCache[lang]
    }
  }
})

// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
var wordlist
try {
  wordlist = require('./wordlists/chinese_simplified.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/chinese_traditional.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/korean.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/french.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/italian.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/spanish.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/japanese.json')
} catch (err) {}
try {
  wordlist = require('./wordlists/english.json')
} catch (err) {}

// Last one to overwrite wordlist gets to be default.
module.exports = {
  wordlists: wordlists,
  default: wordlist
}
