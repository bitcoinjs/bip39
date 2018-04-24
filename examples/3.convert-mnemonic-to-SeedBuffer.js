bip39 = require("../")

var mnemonic = 'legend trust army surround organ clinic man impose arrow language island can'
var seedBuffer = bip39.mnemonicToSeed(mnemonic)

console.log(seedBuffer);
