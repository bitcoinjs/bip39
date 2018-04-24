// Checks if mnemonic is valid(provides >128 bits of entropy)

bip39 = require("../")

var mnemonic = 'legend trust army surround organ clinic man impose arrow language island can'

// true implies it is valid and false imples that mnemonic is invalid
function val(mnemonic){
  if (bip39.validateMnemonic(mnemonic)==true){
    return "valid"
  }else{return "invalid"}
}

console.log("The Mnemonic '"+mnemonic+"' is " + val(mnemonic));
