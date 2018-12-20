// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
var wordlists = {}
var wordlist
try {
  wordlist = require('./wordlists/chinese_simplified.json')
  wordlists.chinese_simplified = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/chinese_traditional.json')
  wordlists.chinese_traditional = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/korean.json')
  wordlists.korean = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/french.json')
  wordlists.french = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/italian.json')
  wordlists.italian = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/spanish.json')
  wordlists.spanish = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/japanese.json')
  wordlists.japanese = wordlist
  wordlists.JA = wordlist
} catch (err) {}
try {
  wordlist = require('./wordlists/english.json')
  wordlists.english = wordlist
  wordlists.EN = wordlist
} catch (err) {}

// Last one to overwrite wordlist gets to be default.
module.exports = {
  wordlists: wordlists,
  default: wordlist
}
