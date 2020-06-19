let fs = require('fs')
let dhttp = require('dhttp/200')
let path = require('path')
let series = require('run-series')
let WORDLISTS = {
  'chinese_simplified': ' ',
  'chinese_traditional': ' ',
  'english': ' ',
  'french': ' ',
  'italian': ' ',
  'japanese': '\u3000',
  'korean': ' ',
  'spanish': ' '
}

function download (callback) {
  series(Object.keys(WORDLISTS).map((name) => {
    let separator = WORDLISTS[name]

    return (next) => {
      dhttp({
        method: 'GET',
        url: 'https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/' + name + '.txt'
      }, (err, body) => {
        if (err) return next(err)

        next(null, {
          name,
          words: body
            .trim()
            .split('\n')
            .map((word) => word.trim()),
          separator
        })
      })
    }
  }), callback)
}

function update () {
  download((err, objs) => {
    if (err) return console.error(err)

    series(objs.map((obj) => {
      let name = obj.name
      let json = JSON.stringify(obj, null, 2)
      let fileName = path.join(__dirname, '..', 'wordlists', name + '.json')

      return (next) => {
        console.log('saving ' + name)
        fs.writeFile(fileName, json, next)
      }
    }), () => console.log('done'))
  })
}

module.exports = { download, update }
