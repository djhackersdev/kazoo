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
  console.log("\n--- %s %s ---\n", req.method, req.url);

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

  // If this does not match the data returned by AllNET then we will receive
  // a ShopUpdate call to make it match.

  res.send("v403db.V403RES_ShopInfo", {
    header,
    battalionName: "batname",
    countryCode: "JPN",
    areaId: 0,
    regionId1: 0,
    regionId2: 0,
    shopName: "asdf",
    shopAddress: "",
    /*score: 4,
    countryRank: 5,
    regionRank: 6,
    areaRank: 7,
    active_Pilot: 8,
    controlFlag: 0,
    availableBanacoin: false,
    semLastUseDay: 9,
    semUseCount: 10,*/
  });
});

// Sent if we mess up the above
app.post("/v403/shop/update", function(req, res) {
  req.recv("v403db.V403REQ_ShopUpdate");

  res.send("v403db.V403RES_ShopUpdate", {
    header,
    countryCode: "JPN",
  });
});

module.exports = app;
