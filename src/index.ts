import { readFileSync } from "fs";
import http = require("http");
import https = require("https");
import tls = require("tls");

import allnet from "./allnet";
import matching from "./matching";
import svc from "./svc";

http.createServer(allnet).listen(80);

tls
  .createServer(
    {
      key: readFileSync("pki/matching.key"),
      cert: readFileSync("pki/matching.pem"),
    },
    matching
  )
  .listen(32639);

https
  .createServer(
    {
      key: readFileSync("pki/accepter.key"),
      cert: readFileSync("pki/accepter.pem"),
    },
    svc
  )
  .listen(32635);

console.log("Startup OK");
