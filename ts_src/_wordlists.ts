// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
const wordlists: { [index: string]: string[] } = {};
let _default: string[] | undefined;
try {
  _default = require('./wordlists/czech.json');
  wordlists.czech = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/chinese_simplified.json');
  wordlists.chinese_simplified = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/chinese_traditional.json');
  wordlists.chinese_traditional = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/korean.json');
  wordlists.korean = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/french.json');
  wordlists.french = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/italian.json');
  wordlists.italian = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/spanish.json');
  wordlists.spanish = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/japanese.json');
  wordlists.japanese = _default as string[];
  wordlists.JA = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/portuguese.json');
  wordlists.portuguese = _default as string[];
} catch (err) {}
try {
  _default = require('./wordlists/english.json');
  wordlists.english = _default as string[];
  wordlists.EN = _default as string[];
} catch (err) {}

// Last one to overwrite wordlist gets to be default.
export { wordlists, _default };
