import { Socket } from "net";

import { setup } from "./pipeline";

export default async function matching(socket: Socket) {
  const { logger, input, output } = setup(socket);

  logger.log("Connection opened");

  try {
    for await (const msg of input) {
      const { type } = msg;

      switch (type) {
        case "HELLO":
          const now = new Date();

          output.write({
            type,
            status: "OK",
            json: {
              time: now.toISOString(),
              majorVer: 57,
              minorVer: 7,
              localVer: 35707,
              sessionId: 1234,
            },
          });

          break;

        case "PING":
          output.write({ type: "PONG" });

          break;

        case "CLIENTLOG":
          output.write({ type, status: "OK" });

          break;

        default:
          logger.log("Received unimplemented command");
      }
    }
  } catch (e) {
    logger.log(e);
  }

  logger.log("Connection closed");
}
