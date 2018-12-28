const express = require("express");
const fs = require("fs");
const protobuf = require("protobufjs");
const read = require("raw-body");

//
// Infrastructure
//

const api = protobuf.loadSync("./protobuf/v403db.proto");

const app = express();

// Logging
app.use(function loggingStep(req, res, next) {
  console.log("--- %s %s ---\n", req.method, req.url);

  return next();
});

// Protobuf boilerplate
app.use(async function protobufStep(req, res, next) {
  if (req.method !== "POST") {
    return next();
  }

  req.body = await read(req);

  req.recv = function protobufRecv(typename) {
    const decoded = api.lookupType(typename).decode(req.body);

    console.log("Received request\n", decoded);

    return decoded;
  };

  const send_ = res.send;

  res.send = function protobufSend(typename, obj) {
    console.log("\nSending response\n", obj);

    const encoded = api
      .lookupType(typename)
      .encode(obj)
      .finish();

    send_.apply(this, [encoded]);
  };

  return next();
});

// Dumping
app.use(function dumpStep(req, res, next) {
  if (fs.existsSync("./dump")) {
    const recv_ = req.recv;

    req.recv = function dumpRecv(typename) {
      fs.writeFileSync(`./dump/${typename}`, req.body);

      return recv_.apply(this, [typename]);
    };
  }

  return next();
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
  req.recv("v403db.V403REQ_ClientUpdate");

  res.send("v403db.V403RES_ClientUpdate", {
    header,
  });
});

app.post("/v403/client/update-errlog", function(req, res) {
  req.recv("v403db.V403REQ_ClientUpdateErrlog");

  res.send("v403db.V403RES_ClientUpdateErrlog", {
    header,
  });
});

app.post("/v403/shop/info", function(req, res) {
  req.recv("v403db.V403REQ_ShopInfo");

  res.send("v403db.V403RES_ShopInfo", {});
});

module.exports = app;
