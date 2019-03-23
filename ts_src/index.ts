import createHash = require('create-hash');
import { pbkdf2 as pbkdf2Async, pbkdf2Sync as pbkdf2 } from 'pbkdf2';
import randomBytes = require('randombytes');

// use unorm until String.prototype.normalize gets better browser support
import unorm = require('unorm');

// import CHINESE_SIMPLIFIED_WORDLIST from '../wordlists/chinese_simplified.json';
import CHINESE_SIMPLIFIED_WORDLIST = require('../wordlists/chinese_simplified.json');
import CHINESE_TRADITIONAL_WORDLIST = require('../wordlists/chinese_traditional.json');
import ENGLISH_WORDLIST = require('../wordlists/english.json');
import FRENCH_WORDLIST = require('../wordlists/french.json');
import ITALIAN_WORDLIST = require('../wordlists/italian.json');
import JAPANESE_WORDLIST = require('../wordlists/japanese.json');
import KOREAN_WORDLIST = require('../wordlists/korean.json');
import SPANISH_WORDLIST = require('../wordlists/spanish.json');
const DEFAULT_WORDLIST = ENGLISH_WORDLIST;

const INVALID_MNEMONIC = 'Invalid mnemonic';
const INVALID_ENTROPY = 'Invalid entropy';
const INVALID_CHECKSUM = 'Invalid mnemonic checksum';

function lpad(str: string, padString: string, length: number): string {
  while (str.length < length) str = padString + str;
  return str;
}

function binaryToByte(bin: string): number {
  return parseInt(bin, 2);
}

function bytesToBinary(bytes: number[]): string {
  return bytes
    .map(function(x) {
      return lpad(x.toString(2), '0', 8);
    })
    .join('');
}

function deriveChecksumBits(entropyBuffer: Buffer) {
  var ENT = entropyBuffer.length * 8;
  var CS = ENT / 32;
  var hash = createHash('sha256')
    .update(entropyBuffer)
    .digest();

  return bytesToBinary([].slice.call(hash)).slice(0, CS);
}

function salt(password?: string) {
  return 'mnemonic' + (password || '');
}

function mnemonicToSeed(mnemonic: string, password: string): Buffer {
  const mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8');
  const saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8');

  return pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
}

function mnemonicToSeedHex(mnemonic: string, password: string): string {
  return mnemonicToSeed(mnemonic, password).toString('hex');
}

function mnemonicToSeedAsync(
  mnemonic: string,
  password: string,
): Promise<Buffer> {
  return new Promise(function(resolve, reject) {
    try {
      var mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8');
      var saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8');
    } catch (error) {
      return reject(error);
    }

    pbkdf2Async(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512', function(
      err,
      data,
    ) {
      if (err) return reject(err);
      else return resolve(data);
    });
  });
}

function mnemonicToSeedHexAsync(
  mnemonic: string,
  password: string,
): Promise<string> {
  return mnemonicToSeedAsync(mnemonic, password).then(function(buf) {
    return buf.toString('hex');
  });
}

function mnemonicToEntropy(mnemonic: string, wordlist: string[]) {
  wordlist = wordlist || DEFAULT_WORDLIST;

  var words = unorm.nfkd(mnemonic).split(' ');
  if (words.length % 3 !== 0) throw new Error(INVALID_MNEMONIC);

  // convert word indices to 11 bit binary strings
  var bits = words
    .map(function(word) {
      var index = wordlist.indexOf(word);
      if (index === -1) throw new Error(INVALID_MNEMONIC);

      return lpad(index.toString(2), '0', 11);
    })
    .join('');

  // split the binary string into ENT/CS
  var dividerIndex = Math.floor(bits.length / 33) * 32;
  var entropyBits = bits.slice(0, dividerIndex);
  var checksumBits = bits.slice(dividerIndex);

  // calculate the checksum and compare
  var entropyBytes = entropyBits.match(/(.{1,8})/g)!.map(binaryToByte);
  if (entropyBytes.length < 16) throw new Error(INVALID_ENTROPY);
  if (entropyBytes.length > 32) throw new Error(INVALID_ENTROPY);
  if (entropyBytes.length % 4 !== 0) throw new Error(INVALID_ENTROPY);

  var entropy = Buffer.from(entropyBytes);
  var newChecksum = deriveChecksumBits(entropy);
  if (newChecksum !== checksumBits) throw new Error(INVALID_CHECKSUM);

  return entropy.toString('hex');
}

function entropyToMnemonic(
  entropy: Buffer | string,
  wordlist?: string[],
): string {
  if (!Buffer.isBuffer(entropy)) entropy = Buffer.from(entropy, 'hex');
  wordlist = wordlist || DEFAULT_WORDLIST;

  // 128 <= ENT <= 256
  if (entropy.length < 16) throw new TypeError(INVALID_ENTROPY);
  if (entropy.length > 32) throw new TypeError(INVALID_ENTROPY);
  if (entropy.length % 4 !== 0) throw new TypeError(INVALID_ENTROPY);

  var entropyBits = bytesToBinary([].slice.call(entropy));
  var checksumBits = deriveChecksumBits(entropy);

  var bits = entropyBits + checksumBits;
  var chunks = bits.match(/(.{1,11})/g)!;
  var words = chunks.map(function(binary) {
    var index = binaryToByte(binary);
    return wordlist![index];
  });

  return wordlist === JAPANESE_WORDLIST
    ? words.join('\u3000')
    : words.join(' ');
}

function generateMnemonic(
  strength?: number,
  rng?: (size: number) => Buffer,
  wordlist?: string[],
): string {
  strength = strength || 128;
  if (strength % 32 !== 0) throw new TypeError(INVALID_ENTROPY);
  rng = rng || randomBytes;

  return entropyToMnemonic(rng(strength / 8), wordlist);
}

function validateMnemonic(mnemonic: string, wordlist: string[]): boolean {
  try {
    mnemonicToEntropy(mnemonic, wordlist);
  } catch (e) {
    return false;
  }

  return true;
}

module.exports = {
  mnemonicToSeed: mnemonicToSeed,
  mnemonicToSeedAsync: mnemonicToSeedAsync,
  mnemonicToSeedHex: mnemonicToSeedHex,
  mnemonicToSeedHexAsync: mnemonicToSeedHexAsync,
  mnemonicToEntropy: mnemonicToEntropy,
  entropyToMnemonic: entropyToMnemonic,
  generateMnemonic: generateMnemonic,
  validateMnemonic: validateMnemonic,
  wordlists: {
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
  },
};
