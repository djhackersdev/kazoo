import express = require("express");
import read = require("raw-body");
import zlib = require("zlib");

const app = express();

// Startup request is url-encoded-ish... except it's also zlibed and base64ed.
// Also the values are not actually escaped. So in the absence of any exotic
// Transfer-Encoding headers this Content-Type is incorrect and we have to
// override Express' built-in handling.

app.use(async function(req, resp, next) {
  if (req.method !== "POST") {
    return resp.status(405).end();
  }

  const base64 = await read(req, { encoding: "ascii" });
  const zbytes = Buffer.from(base64, "base64");
  const bytes = zlib.unzipSync(zbytes);
  const str = bytes.toString().trim();

  const kvps = str.split("&");
  const reqParams = {};

  kvps.forEach(kvp => {
    const [key, val] = kvp.split("=");

    reqParams[key] = val;
  });

  req.body = function() {
    return reqParams;
  };

  const send_ = resp.send;

  resp.send = function(respParams) {
    // Keys and values are not URL-escaped

    const str =
      Object.entries(respParams)
        .map(([key, val]) => key + "=" + val)
        .join("&") + "\n";

    resp.set("content-type", "text/plain");

    return send_.apply(this, [str]);
  };

  return next();
});

app.post("/sys/servlet/PowerOn", function(req, resp) {
  const reqParams = req.body();

  console.log("\n--- Startup Request ---\n\n", reqParams);

  const now = new Date();

  const respParams = {
    stat: 2,
    host: "local",
    name: "asdf",
    place_id: 1234,
    nickname: "fdsa",
    region0: 1,
    setting: 1,
    country: "JPN",
    timezone: "+00:00",
    res_class: "PowerOnResponseVer2",
    uri: "example.com",
    region_name0: "W",
    region_name1: "X",
    region_name2: "Y",
    region_name3: "Z",
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    minute: now.getUTCMinutes(),
    second: now.getUTCSeconds(),
  };

  console.log("\n--- Startup Response ---\n\n", respParams);

  resp.send(respParams);
});

export default app;
