BIP39
=====

[![Build Status](https://travis-ci.org/weilu/bip39.png?branch=master)](https://travis-ci.org/weilu/bip39)

JavaScript implementation of [Bitcoin BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki): Mnemonic code for generating deterministic keys

## Usage

`npm install bip39`

```javascript
var bip39 = require('bip39')

var mnemonic = bip39.entropyToMnemonic('1337') // hex input, defaults to BIP39 English word list
// 'basket actual'

bip39.mnemonicToEntropy(mnemonic) // hex input, defaults to BIP39 English word list
// '1337'

// Generate a random mnemonic using crypto.randomBytes
mnemonic = bip39.generateMnemonic() // strength defaults to 128 bits
// 'seed sock milk update focus rotate barely fade car face mechanic mercy'

bip39.mnemonicToSeedHex('basket actual')
// '5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f'

bip39.mnemonicToSeed('basket actual')
// <Buffer 5c f2 d4 a8 b0 35 5e 90 29 5b df c5 65 a0 22 a4 09 af 06 3d 53 65 bb 57 bf 74 d9 52 8f 49 4b fa 44 00 f5 3d 83 49 b8 0f da e4 40 82 d7 f9 54 1e 1d ba 2b ...>

bip39.validateMnemonic(mnemonic)
// true

bip39.validateMnemonic('basket actual')
// false
```

### Browser

Compile `bip39.js` with the following command:

    $ npm run compile

After loading this file in your browser, you will be able to use the global `bip39` object.
