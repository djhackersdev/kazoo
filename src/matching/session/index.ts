import { pegasus } from "../../../generated/pegasus";
import { BasicSession } from "./basic";
import { Context } from "./context";
import { GroupSession } from "./group";
import { StatusSession } from "./status";
import { PubSubSession } from "./pubsub";
import { BarrierSession } from "./barrier";

// Tagged unions are not a first-class concept in the Protobuf data model, so
// v4 isn't as elegant and type-safe as it was in the v3 branch.

export class Session {
  private readonly _basic: BasicSession;
  private readonly _group: GroupSession;
  private readonly _pubsub: PubSubSession;
  private readonly _status: StatusSession;
  private readonly _barrier: BarrierSession;

  constructor(ctx: Context) {
    this._basic = new BasicSession(ctx);
    this._group = new GroupSession(ctx);
    this._pubsub = new PubSubSession(ctx);
    this._status = new StatusSession(ctx);
    this._barrier = new BarrierSession(ctx);
  }

  destroy() {
    this._group.destroy();
    this._pubsub.destroy();
    this._status.destroy();
    this._barrier.destroy();
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case undefined: // Seems to be a ping?
      case pegasus.TypeNum.HELLO:
      case pegasus.TypeNum.PING:
      case pegasus.TypeNum.CLIENT_LOG:
        return this._basic.dispatch(cmd);

      case pegasus.TypeNum.GROUP_CREATE:
      case pegasus.TypeNum.GROUP_SEARCH:
      case pegasus.TypeNum.GROUP_CLOSE:
      case pegasus.TypeNum.GROUP_JOIN:
        return this._group.dispatch(cmd);

      case pegasus.TypeNum.STS_OPEN:
      case pegasus.TypeNum.STS_SET:
      case pegasus.TypeNum.STS_CLOSE:
        return this._status.dispatch(cmd);

      case pegasus.TypeNum.PUBLISH:
      case pegasus.TypeNum.SUBSCRIBE:
      case pegasus.TypeNum.UNSUBSCRIBE:
        return this._pubsub.dispatch(cmd);

      case pegasus.TypeNum.KEY_MATCH:
      case pegasus.TypeNum.SYNC:
        return this._barrier.dispatch(cmd);

      default:
        throw new Error("Unsupported command");
    }
  }
}
