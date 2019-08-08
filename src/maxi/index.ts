import http from "http";

import createAllnet from "../allnet";
import exvs from "./exvs";
import mms from "./mms";

export default function startMaxi() {
  const allnet = createAllnet({
    host: "",
    uri: "http://exvs.local:9000/exvs",
  });

  http.createServer(allnet).listen(80);
  http.createServer(exvs).listen(9000);
  http.createServer(mms).listen(9001);

  console.log("Maxiboost Startup OK");
}
