const express = require('express')
const read = require('raw-body')
const zlib = require('zlib')
const os = require('os')

const app = express()

// Startup request is url-encoded-ish... except it's also zlibed and base64ed.
// Also the values are not actually escaped. So in the absence of any exotic
// Transfer-Encoding headers this Content-Type is incorrect and we have to
// override Express' built-in handling.

app.use(async function (req, resp, next) {
  if (req.method !== 'POST') {
    return resp.status(405).end()
  }

  const base64 = await read(req, { encoding: 'ascii' })
  const buf = Buffer.from(base64, 'base64')
  const bytes = zlib.unzipSync(buf)
  const str = bytes.toString().trim()

  const kvps = str.split('&')
  const reqParams = {}

  kvps.forEach(kvp => {
    const [ key, val ] = kvp.split('=')

    reqParams[key] = val
  })

  req.body = function() {
    return reqParams
  }

  const send_ = resp.send

  resp.send = function (respParams) {
    // Keys and values are not URL-escaped

    const str = Object.entries(
      respParams
    ).map( ([ key, val ]) =>
      key + '=' + val
    ).join('&') + '\r\n'

    resp.set('content-type', 'text/plain')
    send_.apply(this, [ str ])
  }

  return next()
})

app.post('/sys/servlet/PowerOn', function (req, resp) {
  const reqParams = req.body()

  console.log('\n--- Startup Request ---\n\n', reqParams)

  const now = new Date()

  const respParams = {
    stat: 1,
    uri: '',
    host: 'local',
    place_id: 1234,
    name: 'asdf',
    nickname: 'fdsa',
    region0: 'addr',
    region_name0: '',
    region_name1: '',
    region_name2: '',
    region_name3: '',
    country: 'JPN',
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    minute: now.getUTCMinutes(),
    second: now.getUTCSeconds(),
    setting: 1,
    timezone: '+0000',
    res_class: 'PowerOnResponseVer2',
  }

  console.log('\n--- Startup Response ---\n\n', respParams)

  resp.send(respParams)
})

module.exports = app
