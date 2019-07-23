import express = require("express");
import morgan = require("morgan");
import read = require("raw-body");

import { gk4db } from "../../generated/gk4_db_msg";

//
// Plumbing
//

const app = express();

app.use(morgan("dev"));

app.use(async function(req, res, next) {
  if (req.method === "POST") {
    req.body = await read(req);
    res.setHeader("X-Drpc-Code", "0");
  }

  next();
});

//
// Helpers
//

function header(): gk4db.IResponseHeader {
  const now = new Date();

  return {
    serverTime: {
      seconds: Math.floor(now.getTime() / 1000),
      nanos: (now.getTime() % 1000) * 1000000,
    },
  };
}

function dump(obj: any) {
  console.log(JSON.stringify(obj, undefined, 4), "\n");
}

//
// Handlers
//

app.post("/gk4db.Arcade/RegistClient", function(req, res) {
  const reqp = gk4db.RegistClientRequest.decode(req.body);

  dump(reqp);

  const resp = new gk4db.RegistClientResponse({
    header: header(),
    authToken: "asdf",
  });

  dump(resp);

  res.send(gk4db.RegistClientResponse.encode(resp).finish());
});

app.post("/gk4db.Arcade/GameConfig", function(req, res) {
  const reqp = gk4db.GameConfigRequest.decode(req.body);

  dump(reqp);

  const resp = new gk4db.GameConfigResponse({
    header: header(),
    requiredClientVersion: reqp.header!.clientVer,
    matchingHost: "blue.tembin.local",
    matchingPort: 443,
    telop: "telop",
  });

  dump(resp);

  res.send(gk4db.GameConfigResponse.encode(resp).finish());
});

app.post("/gk4db.Arcade/ErrorLog", function(req, res) {
  const reqp = gk4db.ErrorLogRequest.decode(req.body);

  dump(reqp);

  const resp = new gk4db.ErrorLogResponse({
    header: header(),
  });

  dump(resp);

  res.send(gk4db.ErrorLogResponse.encode(resp).finish());
});

export default app;
