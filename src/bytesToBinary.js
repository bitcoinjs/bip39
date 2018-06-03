var lpad = require('./lpad')

function bytesToBinary (bytes) {
  return bytes.map(function (x) {
    return lpad(x.toString(2), '0', 8)
  }).join('')
}

module.exports = bytesToBinary
