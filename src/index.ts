import { readFileSync } from "fs";
import http from "http";
import https from "https";
import tls from "tls";

import accepter from "./kizuna/accepter";
import matching from "./kizuna/matching";
import allnet from "./allnet";

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
