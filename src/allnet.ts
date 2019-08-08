import { findTimeZone, getZonedTime } from "timezone-support";
import express from "express";
import read from "raw-body";
import zlib from "zlib";

const jst = findTimeZone("Asia/Tokyo");

interface ServiceOpt {
  host: string;
  uri: string;
}

export default function createAllnet(serviceOpt: ServiceOpt) {
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

    const utc = new Date();
    const local = getZonedTime(utc, jst);
    const { host, uri } = serviceOpt;

    const respParams = {
      stat: 2,
      host,
      name: "asdf",
      place_id: 1234,
      nickname: "fdsa",
      region0: 1,
      setting: 1,
      country: "JPN",
      timezone: "+09:00",
      res_class: "PowerOnResponseVer2",
      uri,
      region_name0: "W",
      region_name1: "X",
      region_name2: "Y",
      region_name3: "Z",
      year: local.year,
      month: local.month,
      day: local.day,
      hour: local.hours,
      minute: local.minutes,
      second: local.seconds,
    };

    console.log("\n--- Startup Response ---\n\n", respParams);

    resp.send(respParams);
  });

  return app;
}
