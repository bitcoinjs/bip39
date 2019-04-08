# 3.0.0
__added__
- Added TypeScript support (#104)
- Added support for excluding wordlists from packages (#105)

__changed__
- Changed `mnemonicToSeed` to use async, sync version moved to `mnemonicToSeedSync` (#104)

__removed__
- Removed explicit hex methods (use `toString('hex')` on the Buffer) (#104)

# 2.3.1

__breaking changes__

9-letter mnemonics can no longer be geerated and calling `validateMnemonic` will always return false. This was [fixed in the BIP as a patch](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#generating-the-mnemonic), so we had to follow suite.
