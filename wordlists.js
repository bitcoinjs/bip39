// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
var wordlists = {}
var _default
try {
  _default = require('./wordlists/chinese_simplified.json')
  wordlists.chinese_simplified = _default
} catch (err) {}
try {
  _default = require('./wordlists/chinese_traditional.json')
  wordlists.chinese_traditional = _default
} catch (err) {}
try {
  _default = require('./wordlists/korean.json')
  wordlists.korean = _default
} catch (err) {}
try {
  _default = require('./wordlists/french.json')
  wordlists.french = _default
} catch (err) {}
try {
  _default = require('./wordlists/italian.json')
  wordlists.italian = _default
} catch (err) {}
try {
  _default = require('./wordlists/spanish.json')
  wordlists.spanish = _default
} catch (err) {}
try {
  _default = require('./wordlists/japanese.json')
  wordlists.japanese = _default
  wordlists.JA = _default
} catch (err) {}
try {
  _default = require('./wordlists/english.json')
  wordlists.english = _default
  wordlists.EN = _default
} catch (err) {}

// Last one to overwrite wordlist gets to be default.
module.exports = {
  wordlists: wordlists,
  default: _default
}
