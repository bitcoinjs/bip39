"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
const wordlistFilenames = [
    'chinese_simplified',
    'chinese_traditional',
    'korean',
    'french',
    'italian',
    'spanish',
    'japanese',
    'english',
];
const wordlists = {};
exports.wordlists = wordlists;
let _default;
exports._default = _default;
wordlistFilenames.forEach(lang => {
    try {
        exports._default = _default = require('./wordlists/' + lang + '.json');
        wordlists[lang] = _default;
        if (lang === 'japanese')
            wordlists.JA = _default;
        if (lang === 'english')
            wordlists.EN = _default;
    }
    catch (err) { }
});
