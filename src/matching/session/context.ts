import { Logger } from "../logger";
import * as Model from "../model";
import { Output } from "../proto/pipeline";
import { World } from "../world/world";

export interface Context {
  sessionId: Model.SessionId;
  world: World;
  output: Output;
  logger: Logger;
}
