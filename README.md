bip39
=====

JavaScript implementation of [Bitcoin BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki): Mnemonic code for generating deterministic keys

## Usage

`npm install bip39`

```javascript
bip39 = require('bip39')
bip39.mnemonicToSeed('crazy horse battery staple')
// wait for it...
// 'd6b0f05e5e039b4b4adb72e84f3d5df121cc2dba8b236a1b3a5a8d487b9641096717364fc96e24ddbc648e0e6badbff72332e7d44dc2a42796c2d7e58ee632de'
```

## TODO

- seedToMnemonic
- generateMnemonic
