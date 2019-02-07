import express = require("express");
import read = require("raw-body");

import { v403db } from "../generated/v403db";

//
// Infrastructure
//

const app = express();

//
// Logging
//

app.use(function loggingStep(req, res, next) {
  console.log("\n--- %s %s ---\n", req.method, req.url);

  return next();
});

//
// Common request handling bits
//

app.use(async function readStep(req, res, next) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  req.body = await read(req);

  return next();
});

//
// Generic success header
//

const header: v403db.IResponseHeader = {
  success: true,
  errcode: 0,
  protover: 20110702,
};

//
// Handlers
//

app.post("/v403/client/update", function(req, res) {
  v403db.V403REQ_ClientUpdate.decode(req.body);

  res.send(
    v403db.V403RES_ClientUpdate.encode({
      header,
    }).finish()
  );
});

app.post("/v403/client/update-errlog", function(req, res) {
  v403db.V403REQ_ClientUpdateErrlog.decode(req.body);

  res.send(
    v403db.V403RES_ClientUpdateErrlog.encode({
      header,
    }).finish()
  );
});

app.post("/v403/shop/info", function(req, res) {
  // If this does not match the data returned by AllNET then we will receive
  // a ShopUpdate call to make it match.

  v403db.V403REQ_ShopInfo.decode(req.body);

  res.send(
    v403db.V403RES_ShopInfo.encode({
      header,
      battalionName: "batname",
      countryCode: "JPN",
      areaId: 0,
      regionId1: 0,
      regionId2: 0,
      shopName: "asdf",
      shopAddress: "",
      score: 4,
      countryRank: 5,
      regionRank: 6,
      areaRank: 7,
      activePilot: 8,
      controlFlag: 0,
      availableBanacoin: false,
      semLastUseDay: 9,
      semUseCount: 10,
    }).finish()
  );
});

// Sent if we mess up the above
app.post("/v403/shop/update", function(req, res) {
  v403db.V403REQ_ShopUpdate.decode(req.body);

  res.send(
    v403db.V403RES_ShopUpdate.encode({
      header,
    }).finish()
  );
});

app.post("/v403/game/config", function(req, res) {
  v403db.V403REQ_GameConfig.decode(req.body);

  res.send(
    v403db.V403RES_GameConfig.encode({
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
      eventRegulation1: 0,
      eventRegulation2: 0,
    }).finish()
  );
});

app.post("/v403/warevent/status", function(req, res) {
  v403db.V403REQ_WarEventStatus.decode(req.body);

  res.send(
    v403db.V403RES_WarEventStatus.encode({
      header,
      eventId: 0,
      // A whole shitload of optional fields. Let's try to disable this
      // "war event".
    }).finish()
  );
});

app.post("/v403/notice/config", function(req, res) {
  v403db.V403REQ_NoticeConfig.decode(req.body);

  res.send(
    v403db.V403RES_NoticeConfig.encode({
      header,
      // A repeated field listing update packages? follows
    }).finish()
  );
});

export default app;
