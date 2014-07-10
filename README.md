bip39
=====

JavaScript implementation of [Bitcoin BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki): Mnemonic code for generating deterministic keys

## Usage

`npm install bip39`

```javascript
var BIP39 = require('bip39')

// defaults to BIP39 English word list
var bip39 = new BIP39()

var mnemonic = bip39.entropyToMnemonic('1337') // hex input, defaults to BIP39 English word list
// 'basket actual'

// or
mnemonic = bip39.generateMnemonic() // strength defaults to 128 bits
// 'seed sock milk update focus rotate barely fade car face mechanic mercy'

bip39.mnemonicToSeedHex('basket actual') // wait for it...
// '5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f'

```
### Browser

Compile `bip39.js` with the following command:

    $ npm run compile

After loading this file in your browser, you will be able to use the global `BIP39` object.

