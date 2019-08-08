import express from "express";
import morgan from "morgan";
import read from "raw-body";

import { mms } from "../../generated/nue.protocol.mms";

//
// State
//

let nextNodeId = 1;

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

app.post("/mms", function(req, res) {
  const reqp = mms.Request.decode(req.body);

  dump(reqp);

  const resp = _dispatch(reqp);

  dump(resp);

  res.send(mms.Response.encode(resp).finish());
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

function _dispatch(reqp: mms.Request): mms.Response {
  switch (reqp.type) {
    case mms.MethodType.PING:
      return ping(reqp);

    case mms.MethodType.ISSUE_NODE_ID:
      return issueNodeId(reqp);

    default:
      return _unknown(reqp);
  }
}

function ping(reqp: mms.Request) {
  return new mms.Response({
    type: mms.MethodType.PING,
    requestId: reqp.requestId,
    code: mms.ErrorCode.SUCCESS,
    ping: {},
  });
}

function issueNodeId(reqp: mms.Request) {
  const nodeId = new Array<number>();

  for (let i = 0; i < reqp.issueNodeId!.issueCount!; i++) {
    nodeId.push(nextNodeId++);
  }

  return new mms.Response({
    type: reqp.type,
    requestId: reqp.requestId,
    code: mms.ErrorCode.SUCCESS,
    issueNodeId: {
      nodeId,
    },
  });
}

function _unknown(reqp: mms.Request) {
  return new mms.Response({
    type: reqp.type,
    requestId: reqp.requestId,
    code: mms.ErrorCode.ERR_SERVER,
  });
}

export default app;
