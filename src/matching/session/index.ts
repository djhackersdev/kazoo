import { BasicSession } from "./basic";
import { Context } from "./context";
import { GroupSession } from "./group";
import { StatusSession } from "./status";
import { PubSubSession } from "./pubsub";
import * as Decoder from "../proto/decoder";

export class Session {
  private readonly _basic: BasicSession;
  private readonly _group: GroupSession;
  private readonly _pubsub: PubSubSession;
  private readonly _status: StatusSession;

  constructor(ctx: Context) {
    this._basic = new BasicSession(ctx);
    this._group = new GroupSession(ctx);
    this._pubsub = new PubSubSession(ctx);
    this._status = new StatusSession(ctx);
  }

  destroy() {
    this._group.destroy();
    this._pubsub.destroy();
    this._status.destroy();
  }

  dispatch(cmd: Decoder.Command) {
    switch (cmd.type) {
      case "HELLO":
      case "PING":
      case "CLIENTLOG":
        return this._basic.dispatch(cmd);

      case "GROUP_CREATE":
      case "GROUP_SEARCH":
        return this._group.dispatch(cmd);

      case "STS_OPEN":
        return this._status.dispatch(cmd);

      case "PUBLISH":
      case "SUBSCRIBE":
        return this._pubsub.dispatch(cmd);

      default:
        throw new Error("Unsupported command");
    }
  }
}
