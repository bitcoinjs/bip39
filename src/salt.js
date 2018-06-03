function salt (password) {
  return 'mnemonic' + (password || '')
}

module.exports = salt
