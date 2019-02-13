import { readFileSync } from "fs";
import http = require("http");
import https = require("https");
import tls = require("tls");

import accepter from "./accepter";
import allnet from "./allnet";
import matching from "./matching";

http.createServer(allnet).listen(80);

https
  .createServer(
    {
      key: readFileSync("pki/accepter.key"),
      cert: readFileSync("pki/accepter.pem"),
    },
    accepter
  )
  .listen(443, "bolaven.local");

tls
  .createServer(
    {
      key: readFileSync("pki/matching.key"),
      cert: readFileSync("pki/matching.pem"),
    },
    matching
  )
  .listen(443, "blue.tembin.local");

console.log("Startup OK");
