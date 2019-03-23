"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const createHash = require("create-hash");
const pbkdf2_1 = require("pbkdf2");
const randomBytes = require("randombytes");
// use unorm until String.prototype.normalize gets better browser support
const unorm = require("unorm");
// import CHINESE_SIMPLIFIED_WORDLIST from '../wordlists/chinese_simplified.json';
const CHINESE_SIMPLIFIED_WORDLIST = require("./wordlists/chinese_simplified.json");
const CHINESE_TRADITIONAL_WORDLIST = require("./wordlists/chinese_traditional.json");
const ENGLISH_WORDLIST = require("./wordlists/english.json");
const FRENCH_WORDLIST = require("./wordlists/french.json");
const ITALIAN_WORDLIST = require("./wordlists/italian.json");
const JAPANESE_WORDLIST = require("./wordlists/japanese.json");
const KOREAN_WORDLIST = require("./wordlists/korean.json");
const SPANISH_WORDLIST = require("./wordlists/spanish.json");
const DEFAULT_WORDLIST = ENGLISH_WORDLIST;
const INVALID_MNEMONIC = 'Invalid mnemonic';
const INVALID_ENTROPY = 'Invalid entropy';
const INVALID_CHECKSUM = 'Invalid mnemonic checksum';
function lpad(str, padString, length) {
    while (str.length < length)
        str = padString + str;
    return str;
}
function binaryToByte(bin) {
    return parseInt(bin, 2);
}
function bytesToBinary(bytes) {
    return bytes.map(x => lpad(x.toString(2), '0', 8)).join('');
}
function deriveChecksumBits(entropyBuffer) {
    const ENT = entropyBuffer.length * 8;
    const CS = ENT / 32;
    const hash = createHash('sha256')
        .update(entropyBuffer)
        .digest();
    return bytesToBinary([].slice.call(hash)).slice(0, CS);
}
function salt(password) {
    return 'mnemonic' + (password || '');
}
function mnemonicToSeed(mnemonic, password) {
    const mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8');
    const saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8');
    return pbkdf2_1.pbkdf2Sync(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
}
exports.mnemonicToSeed = mnemonicToSeed;
function mnemonicToSeedHex(mnemonic, password) {
    return mnemonicToSeed(mnemonic, password).toString('hex');
}
exports.mnemonicToSeedHex = mnemonicToSeedHex;
function mnemonicToSeedAsync(mnemonic, password) {
    return new Promise((resolve, reject) => {
        try {
            const mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8');
            const saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8');
            pbkdf2_1.pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512', (err, data) => {
                if (err)
                    return reject(err);
                else
                    return resolve(data);
            });
        }
        catch (error) {
            return reject(error);
        }
    });
}
exports.mnemonicToSeedAsync = mnemonicToSeedAsync;
function mnemonicToSeedHexAsync(mnemonic, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const buf = yield mnemonicToSeedAsync(mnemonic, password);
        return buf.toString('hex');
    });
}
exports.mnemonicToSeedHexAsync = mnemonicToSeedHexAsync;
function mnemonicToEntropy(mnemonic, wordlist) {
    wordlist = wordlist || DEFAULT_WORDLIST;
    const words = unorm.nfkd(mnemonic).split(' ');
    if (words.length % 3 !== 0)
        throw new Error(INVALID_MNEMONIC);
    // convert word indices to 11 bit binary strings
    const bits = words
        .map(word => {
        const index = wordlist.indexOf(word);
        if (index === -1)
            throw new Error(INVALID_MNEMONIC);
        return lpad(index.toString(2), '0', 11);
    })
        .join('');
    // split the binary string into ENT/CS
    const dividerIndex = Math.floor(bits.length / 33) * 32;
    const entropyBits = bits.slice(0, dividerIndex);
    const checksumBits = bits.slice(dividerIndex);
    // calculate the checksum and compare
    const entropyBytes = entropyBits.match(/(.{1,8})/g).map(binaryToByte);
    if (entropyBytes.length < 16)
        throw new Error(INVALID_ENTROPY);
    if (entropyBytes.length > 32)
        throw new Error(INVALID_ENTROPY);
    if (entropyBytes.length % 4 !== 0)
        throw new Error(INVALID_ENTROPY);
    const entropy = Buffer.from(entropyBytes);
    const newChecksum = deriveChecksumBits(entropy);
    if (newChecksum !== checksumBits)
        throw new Error(INVALID_CHECKSUM);
    return entropy.toString('hex');
}
exports.mnemonicToEntropy = mnemonicToEntropy;
function entropyToMnemonic(entropy, wordlist) {
    if (!Buffer.isBuffer(entropy))
        entropy = Buffer.from(entropy, 'hex');
    wordlist = wordlist || DEFAULT_WORDLIST;
    // 128 <= ENT <= 256
    if (entropy.length < 16)
        throw new TypeError(INVALID_ENTROPY);
    if (entropy.length > 32)
        throw new TypeError(INVALID_ENTROPY);
    if (entropy.length % 4 !== 0)
        throw new TypeError(INVALID_ENTROPY);
    const entropyBits = bytesToBinary([].slice.call(entropy));
    const checksumBits = deriveChecksumBits(entropy);
    const bits = entropyBits + checksumBits;
    const chunks = bits.match(/(.{1,11})/g);
    const words = chunks.map(binary => {
        const index = binaryToByte(binary);
        return wordlist[index];
    });
    return wordlist === JAPANESE_WORDLIST
        ? words.join('\u3000')
        : words.join(' ');
}
exports.entropyToMnemonic = entropyToMnemonic;
function generateMnemonic(strength, rng, wordlist) {
    strength = strength || 128;
    if (strength % 32 !== 0)
        throw new TypeError(INVALID_ENTROPY);
    rng = rng || randomBytes;
    return entropyToMnemonic(rng(strength / 8), wordlist);
}
exports.generateMnemonic = generateMnemonic;
function validateMnemonic(mnemonic, wordlist) {
    try {
        mnemonicToEntropy(mnemonic, wordlist);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.validateMnemonic = validateMnemonic;
exports.wordlists = {
    EN: ENGLISH_WORDLIST,
    JA: JAPANESE_WORDLIST,
    chinese_simplified: CHINESE_SIMPLIFIED_WORDLIST,
    chinese_traditional: CHINESE_TRADITIONAL_WORDLIST,
    english: ENGLISH_WORDLIST,
    french: FRENCH_WORDLIST,
    italian: ITALIAN_WORDLIST,
    japanese: JAPANESE_WORDLIST,
    korean: KOREAN_WORDLIST,
    spanish: SPANISH_WORDLIST,
};
