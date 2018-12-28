const fs = require('fs')
const http = require('http')
const https = require('https')
const tls = require('tls')

const allnet = require('./allnet')
const matching = require('./matching')
const svc = require('./svc')

http.createServer(allnet).listen(80)

https.createServer(
  {
    key: fs.readFileSync('pki/accepter.key'),
    cert: fs.readFileSync('pki/accepter.pem'),
  },
  svc
).listen(32635)

tls.createServer(
  {
    key: fs.readFileSync('pki/matching.key'),
    cert: fs.readFileSync('pki/matching.pem'),
  },
  matching
).listen(32639)
