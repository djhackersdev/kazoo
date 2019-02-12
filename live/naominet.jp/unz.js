#!/usr/bin/node
const fs = require("fs")
const zlib = require("zlib")

const zbytes = fs.readFileSync(process.argv[2]);
const bytes = zlib.inflateSync(zbytes);

fs.writeFileSync(process.argv[3], bytes);
