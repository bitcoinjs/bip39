import createHash = require('create-hash');
import { pbkdf2 as pbkdf2Async, pbkdf2Sync as pbkdf2 } from 'pbkdf2';
import randomBytes = require('randombytes');

// use unorm until String.prototype.normalize gets better browser support
import unorm = require('unorm');

import CHINESE_SIMPLIFIED_WORDLIST = require('./wordlists/chinese_simplified.json');
import CHINESE_TRADITIONAL_WORDLIST = require('./wordlists/chinese_traditional.json');
import ENGLISH_WORDLIST = require('./wordlists/english.json');
import FRENCH_WORDLIST = require('./wordlists/french.json');
import ITALIAN_WORDLIST = require('./wordlists/italian.json');
import JAPANESE_WORDLIST = require('./wordlists/japanese.json');
import KOREAN_WORDLIST = require('./wordlists/korean.json');
import SPANISH_WORDLIST = require('./wordlists/spanish.json');
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
  return bytes.map(x => lpad(x.toString(2), '0', 8)).join('');
}

function deriveChecksumBits(entropyBuffer: Buffer): string {
  const ENT = entropyBuffer.length * 8;
  const CS = ENT / 32;
  const hash = createHash('sha256')
    .update(entropyBuffer)
    .digest();

  return bytesToBinary([].slice.call(hash)).slice(0, CS);
}

function salt(password?: string): string {
  return 'mnemonic' + (password || '');
}

export function mnemonicToSeed(mnemonic: string, password: string): Buffer {
  const mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8');
  const saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8');

  return pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
}

export function mnemonicToSeedHex(mnemonic: string, password: string): string {
  return mnemonicToSeed(mnemonic, password).toString('hex');
}

export function mnemonicToSeedAsync(
  mnemonic: string,
  password: string,
): Promise<Buffer> {
  return new Promise(
    (resolve, reject): void => {
      try {
        const mnemonicBuffer = Buffer.from(unorm.nfkd(mnemonic), 'utf8');
        const saltBuffer = Buffer.from(salt(unorm.nfkd(password)), 'utf8');
        pbkdf2Async(
          mnemonicBuffer,
          saltBuffer,
          2048,
          64,
          'sha512',
          (err, data) => {
            if (err) return reject(err);
            else return resolve(data);
          },
        );
      } catch (error) {
        return reject(error);
      }
    },
  );
}

export async function mnemonicToSeedHexAsync(
  mnemonic: string,
  password: string,
): Promise<string> {
  const buf = await mnemonicToSeedAsync(mnemonic, password);
  return buf.toString('hex');
}

export function mnemonicToEntropy(
  mnemonic: string,
  wordlist?: string[],
): string {
  wordlist = wordlist || DEFAULT_WORDLIST;

  const words = unorm.nfkd(mnemonic).split(' ');
  if (words.length % 3 !== 0) throw new Error(INVALID_MNEMONIC);

  // convert word indices to 11 bit binary strings
  const bits = words
    .map(word => {
      const index = wordlist!.indexOf(word);
      if (index === -1) throw new Error(INVALID_MNEMONIC);

      return lpad(index.toString(2), '0', 11);
    })
    .join('');

  // split the binary string into ENT/CS
  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);

  // calculate the checksum and compare
  const entropyBytes = entropyBits.match(/(.{1,8})/g)!.map(binaryToByte);
  if (entropyBytes.length < 16) throw new Error(INVALID_ENTROPY);
  if (entropyBytes.length > 32) throw new Error(INVALID_ENTROPY);
  if (entropyBytes.length % 4 !== 0) throw new Error(INVALID_ENTROPY);

  const entropy = Buffer.from(entropyBytes);
  const newChecksum = deriveChecksumBits(entropy);
  if (newChecksum !== checksumBits) throw new Error(INVALID_CHECKSUM);

  return entropy.toString('hex');
}

export function entropyToMnemonic(
  entropy: Buffer | string,
  wordlist?: string[],
): string {
  if (!Buffer.isBuffer(entropy)) entropy = Buffer.from(entropy, 'hex');
  wordlist = wordlist || DEFAULT_WORDLIST;

  // 128 <= ENT <= 256
  if (entropy.length < 16) throw new TypeError(INVALID_ENTROPY);
  if (entropy.length > 32) throw new TypeError(INVALID_ENTROPY);
  if (entropy.length % 4 !== 0) throw new TypeError(INVALID_ENTROPY);

  const entropyBits = bytesToBinary([].slice.call(entropy));
  const checksumBits = deriveChecksumBits(entropy);

  const bits = entropyBits + checksumBits;
  const chunks = bits.match(/(.{1,11})/g)!;
  const words = chunks.map(binary => {
    const index = binaryToByte(binary);
    return wordlist![index];
  });

  return wordlist === JAPANESE_WORDLIST
    ? words.join('\u3000')
    : words.join(' ');
}

export function generateMnemonic(
  strength?: number,
  rng?: (size: number) => Buffer,
  wordlist?: string[],
): string {
  strength = strength || 128;
  if (strength % 32 !== 0) throw new TypeError(INVALID_ENTROPY);
  rng = rng || randomBytes;

  return entropyToMnemonic(rng(strength / 8), wordlist);
}

export function validateMnemonic(
  mnemonic: string,
  wordlist?: string[],
): boolean {
  try {
    mnemonicToEntropy(mnemonic, wordlist);
  } catch (e) {
    return false;
  }

  return true;
}

export const wordlists = {
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
