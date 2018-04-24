bip39 = require("../")

var seedBuffer = bip39.mnemonicToSeed('legend trust army surround organ clinic man impose arrow language island can')

console.log(seedBuffer);
