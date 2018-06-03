var createHash = require('create-hash')
var bytesToBinary = require('./bytesToBinary')

function deriveChecksumBits (entropyBuffer) {
  var ENT = entropyBuffer.length * 8
  var CS = ENT / 32
  var hash = createHash('sha256').update(entropyBuffer).digest()

  return bytesToBinary([].slice.call(hash)).slice(0, CS)
}

module.exports = deriveChecksumBits
