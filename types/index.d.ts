/// <reference types="node" />
export declare function mnemonicToSeed(mnemonic: string, password: string): Buffer;
export declare function mnemonicToSeedHex(mnemonic: string, password: string): string;
export declare function mnemonicToSeedAsync(mnemonic: string, password: string): Promise<Buffer>;
export declare function mnemonicToSeedHexAsync(mnemonic: string, password: string): Promise<string>;
export declare function mnemonicToEntropy(mnemonic: string, wordlist?: string[]): string;
export declare function entropyToMnemonic(entropy: Buffer | string, wordlist?: string[]): string;
export declare function generateMnemonic(strength?: number, rng?: (size: number) => Buffer, wordlist?: string[]): string;
export declare function validateMnemonic(mnemonic: string, wordlist?: string[]): boolean;
export declare const wordlists: {
    EN: string[];
    JA: string[];
    chinese_simplified: string[];
    chinese_traditional: string[];
    english: string[];
    french: string[];
    italian: string[];
    japanese: string[];
    korean: string[];
    spanish: string[];
};
