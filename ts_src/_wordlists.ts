// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
const wordlistFilenames: string[] = [
  'chinese_simplified',
  'chinese_traditional',
  'korean',
  'french',
  'italian',
  'spanish',
  'japanese',
  'english', // Last language available in list will be the default.
];
const wordlists: { [index: string]: string[] } = {};
let _default: string[] | undefined;
wordlistFilenames.forEach(lang => {
  try {
    _default = require('./wordlists/' + lang + '.json');
    wordlists[lang] = _default as string[];
    if (lang === 'japanese') wordlists.JA = _default as string[];
    if (lang === 'english') wordlists.EN = _default as string[];
  } catch (err) {}
});

// Last one to overwrite wordlist gets to be default.
export { wordlists, _default };
