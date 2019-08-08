import express from "express";
import morgan from "morgan";
import read from "raw-body";

import { exvs } from "../../generated/nue.protocol.exvs";

//
// Plumbing
//

const app = express();

app.use(morgan("common"));

app.use(async function(req, res, next) {
  if (req.method === "POST") {
    req.body = await read(req);
  }

  next();
});

app.post("/exvs", function(req, res) {
  const reqp = exvs.Request.decode(req.body);

  dump(reqp);

  const resp = _dispatch(reqp);

  dump(resp);

  res.send(exvs.Response.encode(resp).finish());
});

//
// Helpers
//

function dump(obj: any) {
  console.log(JSON.stringify(obj, undefined, 4), "\n");
}

//
// Handlers
//

function _dispatch(reqp: exvs.Request): exvs.Response {
  switch (reqp.type) {
    case exvs.MethodType.MTHD_REGISTER_PCB:
      return registerPcb(reqp);

    case exvs.MethodType.MTHD_REGISTER_PCB_ACK:
      return registerPcbAck(reqp);

    case exvs.MethodType.MTHD_LOAD_SPOT_URL:
      return loadSpotUrl(reqp);

    case exvs.MethodType.MTHD_PING:
      return ping(reqp);

    case exvs.MethodType.MTHD_CHECK_RESOURCE_DATA:
      return checkResourceData(reqp);

    case exvs.MethodType.MTHD_CHECK_TWO_WEEK_UPDATE:
      return checkTwoWeekUpdate(reqp);

    case exvs.MethodType.MTHD_CHECK_TELOP:
      return checkTelop(reqp);

    case exvs.MethodType.MTHD_SAVE_CHARGE:
      return saveCharge(reqp);

    case exvs.MethodType.MTHD_SAVE_INSIDE_DATA:
      return saveInsideData(reqp);

    case exvs.MethodType.MTHD_SAVE_DOWNLOAD_PROGRESS:
      return saveDownloadProgress(reqp);

    case exvs.MethodType.MTHD_LOAD_VS_CONQUEST_GROUP:
      return loadVsConquestGroup(reqp);

    case exvs.MethodType.MTHD_LOAD_BLACK_LIST:
      return loadBlackList(reqp);

    case exvs.MethodType.MTHD_LOAD_CQ_MAP:
      return loadCqMap(reqp);

    case exvs.MethodType.MTHD_LOAD_RANKING:
      return loadRanking(reqp);

    default:
      return _unknown(reqp);
  }
}

function _unknown(reqp: exvs.Request) {
  return new exvs.Response({
    type: reqp.type,
    requestId: reqp.requestId,
    error: exvs.Error.ERR_SERVER,
  });
}

function registerPcb(reqp: exvs.Request) {
  const iota = new Array<number>();

  for (let i = 1; i < 500; i++) {
    iota.push(i);
  }

  return new exvs.Response({
    type: exvs.MethodType.MTHD_REGISTER_PCB,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    registerPcb: {
      serverInfo: [
        {
          serverType: exvs.ServerType.SRV_MATCH,
          uri: "http://mms.local:9001/mms",
          port: 9000,
          accountName: "foo",
          accountPass: "bar",
        },
        {
          serverType: exvs.ServerType.SRV_STUN,
          uri: "stun.local",
          port: 9002,
          accountName: "foo",
          accountPass: "bar",
        },
        {
          serverType: exvs.ServerType.SRV_TURN,
          uri: "turn.local",
          port: 9001,
          accountName: "foo",
          accountPass: "bar",
        },
      ],
      releaseMsId: iota,
      newMsId: iota,
      displayableMsId: iota,
      releaseGuestNavId: iota,
      releaseCpuScene: iota,
      releaseGameRule: iota,
      echelonTables: [
        {
          echelonId: 1,
          onlineMatchRank: 1,
          downDefaultExp: 0.5,
          upDefaultExp: 0.5,
          winCorrectionRate: 1,
          loseCorrectionRate: 1,
        },
      ],
      onVsInfo: {
        bOneNormalDivRate: 1,
        bOneLoseDivRate: 1,
        requestRank: 1,
        ruleTimeLimitTeam: 1,
        ruleTimeLimitShuffle: 1,
        ruleDamageLevelTeam: 1,
        ruleDamageLevelShuffle: 1,
      },
      sramClear: true,
      nextMaintenanceStartAt: 1572717860,
      nextMaintenanceEndAt: 1572717861,
      banacoinAvailableLoc: false,
      banacoinState: exvs.BanacoinStateType.BANACOIN_STATE_STOP,
      creditSetting: {
        startCost: 1,
        continueCost: 1,
      },
      echelonMatchingTables: [
        {
          onlineMatchRank: 1,
          matchingTryNum: 1,
          seqNum: 1,
          makeRoomFlag: true,
        },
      ],
      tagRateMatchingTables: [
        {
          matchingTryNum: 1,
          seqNum: 1,
          makeRoomFlag: true,
        },
      ],
    },
  });
}

function registerPcbAck(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_REGISTER_PCB_ACK,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    registerPcbAck: {},
  });
}

function loadSpotUrl(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_LOAD_SPOT_URL,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    loadSpotUrl: {
      url: "http://example.com/",
      qrcode: Buffer.alloc(16),
      tempPassword: "hello.jpg",
    },
  });
}

function ping(reqp: exvs.Request) {
  const now = new Date();

  return new exvs.Response({
    type: exvs.MethodType.MTHD_PING,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    ping: {
      responseAt: Math.floor(now.getTime() / 1000),
      acidServer: true,
      bnidServer: true,
      gameServer: true,
      matchmakingServer: true,
    },
  });
}

function checkResourceData(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_CHECK_RESOURCE_DATA,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    checkResourceData: {},
  });
}

function checkTwoWeekUpdate(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_CHECK_TWO_WEEK_UPDATE,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    // Seems to carry update package URLs
    // (what about Mucha though?)
    checkTwoWeekUpdate: {},
  });
}

function checkTelop(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_CHECK_TELOP,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    checkTelop: {},
  });
}

function saveCharge(reqp: exvs.Request) {
  const saveChargeResult: exvs.Response.SaveCharge.ISaveChargeResult[] = [];

  for (const item of reqp.saveCharge!.chargeData!) {
    saveChargeResult.push({
      hc2Error: exvs.Response.SaveCharge.SaveChargeResult.Hc2Error.HC2_SUCCESS,
    });
  }

  return new exvs.Response({
    type: exvs.MethodType.MTHD_SAVE_CHARGE,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    saveCharge: {
      saveChargeResult,
    },
  });
}

function saveInsideData(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_SAVE_INSIDE_DATA,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    // Request contains assorted telemetry. Response has no payload.
    saveInsideData: {},
  });
}

function saveDownloadProgress(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_SAVE_DOWNLOAD_PROGRESS,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    saveDownloadProgress: {},
  });
}

function loadVsConquestGroup(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_LOAD_VS_CONQUEST_GROUP,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    loadVsConquestGroup: {
      // TODO..?
      currentConquest: null,
      preConquest: null,
    },
  });
}

function loadBlackList(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_LOAD_BLACK_LIST,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    loadBlackList: {
      thresholdDelayedRtt: 1000,
      maxBlacklistNum: 10,
      blacklist: [],
    },
  });
}

function loadCqMap(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_LOAD_CQ_MAP,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    loadCqMap: {},
  });
}

function loadRanking(reqp: exvs.Request) {
  const now = new Date();

  return new exvs.Response({
    type: exvs.MethodType.MTHD_LOAD_RANKING,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    loadRanking: {
      rankType: reqp.loadRanking!.rankType,
      msUsedRank: {
        sumStart: 0,
        sumEnd: 0,
      },
      playerPointRank: {
        sumStart: 0,
        sumEnd: 0,
      },
      tagPointRank: {
        sumStart: 0,
        sumEnd: 0,
      },

      // Time-limited online events go here...?

      timestamp: Math.floor(now.getTime() / 1000),
    },
  });
}

function loadSpotInfo(reqp: exvs.Request) {
  return new exvs.Response({
    type: exvs.MethodType.MTHD_LOAD_SPOT_INFO,
    requestId: reqp.requestId,
    error: exvs.Error.SUCCESS,

    loadSpotInfo: {
      sinfoBgid: 1,
      sinfoTitle: "TITLE",
      sinfoText: "TEXT",
      infbarSwitch: true,
    },
  });
}

export default app;
