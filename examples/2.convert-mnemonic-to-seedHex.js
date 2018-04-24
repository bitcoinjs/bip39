bip39 = require("../")

// Manual conversion from mnemonic to Seedhex
var mnemonic = 'legend trust army surround organ clinic man impose arrow language island can'
var seedHex = bip39.mnemonicToSeedHex(mnemonic)
console.log("Mnemonic: "+mnemonic+"\n"+"Seedhex: ",seedHex,"\n");

//generate mnemonic and its corresponding seedhex
var mnemonic = bip39.generateMnemonic()
var seedHex = bip39.mnemonicToSeedHex(mnemonic)
console.log("Generated Mnemonic: "+mnemonic+"\n"+"Generated Mnemonic's SeedHex: "+seedHex);
