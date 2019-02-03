import fs = require("fs");
import http = require("http");
import tls = require("tls");

import allnet from "./allnet";
import matching from "./matching";

http.createServer(allnet).listen(80);

tls
  .createServer(
    {
      key: fs.readFileSync("pki/matching.key"),
      cert: fs.readFileSync("pki/matching.pem"),
    },
    matching,
  )
  .listen(32639);

console.log("Startup OK");
