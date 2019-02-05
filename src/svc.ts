import express = require("express");
import fs = require("fs");
import protobuf = require("protobufjs");
import read = require("raw-body");

//
// Infrastructure
//

const api = protobuf.loadSync([
  "./protobuf/v403db.proto",
  "./protobuf/v403db_rev306.proto",
]);

const app = express();

//
// Logging
//

app.use(function loggingStep(req, res, next) {
  console.log("\n--- %s %s ---\n", req.method, req.url);

  return next();
});

//
// Protobuf boilerplate
//

function protobufRecv(req: express.Request, typename: string) {
  if (fs.existsSync("./dump")) {
    fs.writeFileSync(`./dump/${typename}`, req.body);
  }

  const decoded = api.lookupType(typename).decode(req.body);

  console.log("Received request\n", decoded);

  return decoded;
}

function protobufSend(res: express.Response, typename: string, obj: any) {
  console.log("\nSending response\n", obj);

  const encoded = api
    .lookupType(typename)
    .encode(obj)
    .finish();

  res.send(encoded);
}

//
// Generic success header
//

const header = {
  success: true,
  errcode: 0,
  protover: 20110702,
};

//
// Handlers
//

app.post("/POISONOUS/v403/client/update", function(req, res) {
  protobufRecv(req, "v403db.V403REQ_ClientUpdate");
  protobufSend(res, "v403db.V403RES_ClientUpdate", {
    header,
  });
});

app.post("/POISONOUS/v403/client/update-errlog", function(req, res) {
  protobufRecv(req, "v403db.V403REQ_ClientUpdateErrlog");
  protobufSend(res, "v403db.V403RES_ClientUpdateErrlog", {
    header,
  });
});

app.post("/POISONOUS/v403/shop/info", function(req, res) {
  // If this does not match the data returned by AllNET then we will receive
  // a ShopUpdate call to make it match.

  protobufRecv(req, "v403db.V403REQ_ShopInfo");
  protobufSend(res, "v403db.V403RES_ShopInfo", {
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
app.post("/POISONOUS/v403/shop/update", function(req, res) {
  protobufRecv(req, "v403db.V403REQ_ShopUpdate");
  protobufSend(res, "v403db.V403RES_ShopUpdate", {
    header,
    countryCode: "JPN",
  });
});

app.post("/POISONOUS/v403/game/config", function(req, res) {
  protobufRecv(req, "v403db.V403REQ_GameConfig");
  protobufSend(res, "v403db.V403RES_GameConfig", {
    header,
    normalMission1: 0,
    normalMission2: 0,
    eventMission1: 0,
    eventMission2: 0,
    eventOption: 0,
    optionInfo1: 0,
    optionInfo2: 0,
    eventText: "evtext",
    telop: "telop",
    serverFlag1: 0,
    serverFlag2: 0,
    /*eventRegulation1: 0,
    eventRegulation2: 0,*/
  });
});

app.post("/POISONOUS/v403/warevent/status", function(req, res) {
  protobufRecv(req, "v403db.V403REQ_WarEventStatus");
  protobufSend(res, "v403db.V403RES_WarEventStatus", {
    header,
    eventId: 0,
    // A whole shitload of optional fields. Let's try to disable this
    // "war event".
  });
});

app.post("/POISONOUS/v403/notice/config", function(req, res) {
  protobufRecv(req, "v403db.V403REQ_NoticeConfig");
  protobufSend(res, "v403db.V403RES_NoticeConfig", {
    header,
    // A repeated field listing update packages? follows
  });
});

export default app;
