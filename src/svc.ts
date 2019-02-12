import express = require("express");
import read = require("raw-body");
import { inflateSync } from "zlib";

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
// Handlers
//

app.post("/v403/client/update", function(req, res) {
  const reqp = v403db.V403REQ_ClientUpdate.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_ClientUpdate.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
    }).finish()
  );
});

app.post("/v403/client/update-errlog", function(req, res) {
  const reqp = v403db.V403REQ_ClientUpdateErrlog.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_ClientUpdateErrlog.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
    }).finish()
  );
});

app.post("/v403/shop/info", function(req, res) {
  // If this does not match the data returned by AllNET then we will receive
  // a ShopUpdate call to make it match.

  const reqp = v403db.V403REQ_ShopInfo.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_ShopInfo.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
      battalionName: "batname",
      countryCode: "JPN",
      areaId: 1,
      regionId1: 7,
      regionId2: 1,
      shopName: "asdf",
      shopAddress: "WXYZ",
      /*score: 4,
      countryRank: 5,
      regionRank: 6,
      areaRank: 7,
      activePilot: 8,
      controlFlag: 0,
      availableBanacoin: false,
      semLastUseDay: 9,
      semUseCount: 10,*/
    }).finish()
  );
});

// Sent if we mess up the above
app.post("/v403/shop/update", function(req, res) {
  const reqp = v403db.V403REQ_ShopUpdate.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_ShopUpdate.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
    }).finish()
  );
});

app.post("/v403/game/config", function(req, res) {
  const reqp = v403db.V403REQ_GameConfig.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_GameConfig.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
      normalMission1: 1,
      normalMission2: 2,
      eventMission1: 1,
      eventMission2: 2,
      eventOption: 0,
      optionInfo1: 1,
      optionInfo2: 2,
      eventText: "evtext",
      telop: "telop",
      serverFlag1: 1,
      serverFlag2: 1,
      /*eventRegulation1: 10,
      eventRegulation2: 11,
      titleCampaignInfo: {
        eventId: 1,
        eventStampMax: 2,
        eventTitleId: 3,
      },
      exmsCampaignInfo: {
        campaignId: 4,
        period: 5,
        startDate: "20100101",
      },
      rentalmsCampaignInfo: [],
      isBfday: false,
      requiredClientVersion: 35707,*/
    }).finish()
  );
});

app.post("/v403/warevent/status", function(req, res) {
  const reqp = v403db.V403REQ_WarEventStatus.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_WarEventStatus.encode({
      header: {
        success: true,
        errcode: 0,
        // Note! Differs from others!
        protover: v403db.ProtocolVersions_rev306.PROTOCOL_VERSION_REV306,
      },
      eventId: 0,
    }).finish()
  );
});

app.post("/v403/notice/config", function(req, res) {
  const reqp = v403db.V403REQ_NoticeConfig.decode(req.body);

  console.log(JSON.stringify(reqp));

  res.send(
    v403db.V403RES_NoticeConfig.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
      notice: [],
    }).finish()
  );
});

app.post("/v403/clientlog/update", function(req, res) {
  const reqp = v403db.V403REQ_ClientlogUpdate.decode(req.body);

  for (const record of reqp.records) {
    try {
      const chunks = record.logData.split(",");
      const zbytes = Buffer.from(chunks[3], "base64");
      const bytes = inflateSync(zbytes);
      const ascii = bytes.toString("ascii");

      console.log(ascii);
    } catch (e) {
      console.log("bad record");
    }
  }

  res.send(
    v403db.V403RES_ClientlogUpdate.encode({
      header: {
        success: true,
        errcode: 0,
        protover: v403db.ProtocolVersions.PROTOCOL_VERSION,
      },
    }).finish()
  );
});

export default app;
