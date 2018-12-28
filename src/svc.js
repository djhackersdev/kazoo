const bodyParser = require("body-parser");
const express = require("express");
const protobuf = require("protobufjs");

//
// Infrastructure
//

const api = protobuf.loadSync("./protobuf/v403db.proto");

const app = express();

app.use(bodyParser.raw());

// Logging
app.use(function(req, res, next) {
  console.log("--- Request %s ---\n", req.url);
  next();
});

// Protobuf boilerplate
app.use(function(req, res, next) {
  req.recv = function(typename) {
    const decoded = api.lookupType(typename).decode(req.body);

    console.log("Received request", decoded);

    return decoded;
  };

  const send_ = res.send;

  res.send = function(typename, obj) {
    console.log("Sending response", obj);

    const encoded = api
      .lookupType(typename)
      .encode(obj)
      .finish();

    send_.apply(this, [encoded]);
  };

  next();
});

// Generic success header
const header = {
  success: true,
  errcode: 0,
  protover: 20110702,
};

//
// Handlers
//

app.post("/v403/client/update", function(req, res) {
  const msg = req.recv("v403db.V403REQ_ClientUpdate");

  res.send("v403db.V403RES_ClientUpdate", {
    header,
  });
});

app.post("/v403/client/update-errlog", function(req, res) {
  const msg = req.recv("v403db.V403REQ_ClientUpdateErrlog");

  console.log(msg);

  const respCodec = res.send("v403db.V403RES_ClientUpdateErrlog", {
    header,
  });
});

module.exports = app;
