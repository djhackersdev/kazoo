const fs = require('fs')
const http = require('http')
const tls = require('tls')

const allnet = require('./allnet')
const matching = require('./matching')

http.createServer(allnet).listen(80)

tls.createServer(
  {
    key: fs.readFileSync('pki/matching.key'),
    cert: fs.readFileSync('pki/matching.pem'),
  },
  matching
).listen(32639)
