const http = require('http')

const allnet = require('./allnet')

http.createServer(allnet).listen(80)
