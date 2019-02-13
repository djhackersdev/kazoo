import { Logger } from "../logger";
import { Output } from "../proto/pipeline";
import { SessionId } from "../world/session";
import { World } from "../world/world";

export interface Context {
  sessionId: SessionId;
  world: World;
  output: Output;
  logger: Logger;
}
