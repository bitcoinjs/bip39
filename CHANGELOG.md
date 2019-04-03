# 3.0.0
__added__
- Added TypeScript support (#104)
- Added support for excluding wordlists from packages (#105)

__changed__
- Changed `mnemonicToSeed` to use async, sync version moved to `mnemonicToSeedSync` (#104)

__removed__
- Removed explicit hex methods (use `toString('hex')` on the Buffer) (#104)
