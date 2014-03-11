bip39
=====

JavaScript implementation of [Bitcoin BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki): Mnemonic code for generating deterministic keys

## Usage

`npm install bip39`

```javascript
var BIP39 = require('bip39')

bip39 = new BIP39() // 'en' is the default language

bip39.entropyToMnemonic('1337') // hex input
// 'basket actual'

bip39.mnemonicToSeed('basket actual') // wait for it...
// '5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f'
```

## TODO

- generateMnemonic
