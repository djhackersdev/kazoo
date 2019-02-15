import { pegasus } from "../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import { SessionId } from "../world/session";
import { World } from "../world/world";
import { Context } from "./context";

export class MatchSession {
  private readonly _world: World;
  private readonly _output: Output;
  private readonly _sessionId: SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  destroy() {}

  dispatch(cmd: pegasus.Command_Client) {
    if (cmd.type !== pegasus.TypeNum.KEY_MATCH) {
      throw new Error("Misrouted command!");
    }

    this._keyMatch(cmd.keyMatch!);
  }

  private _keyMatch(cmd: pegasus.IKeyMatch_Client) {
    this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.KEY_MATCH,
        keyMatch: new pegasus.KeyMatch_Server({
          battleID: 300,
          channel: cmd.channel,
          memberList: [this._sessionId],
        }),
      })
    );
  }
}
