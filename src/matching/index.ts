import { Socket } from "net";

import { setup } from "./pipeline";
import { Session } from "./session";
import { World } from "./world";

const world = new World();

export default async function matching(socket: Socket) {
  const { logger, input, output } = setup(socket);
  const session = new Session({ world, output, logger });

  logger.log("Session opened");

  try {
    for await (const cmd of input) {
      session.dispatch(cmd);
    }
  } catch (e) {
    logger.log(e);
  }

  session.destroy();

  logger.log("Session closed");
}
