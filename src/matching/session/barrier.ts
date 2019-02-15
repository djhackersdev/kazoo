import { pegasus } from "../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import { SessionId } from "../world/session";
import {
  BarrierWorlds,
  MatchKey,
  SyncKey,
  TimeoutSec,
} from "../world/barrier";
import { Context } from "./context";

export class BarrierSession {
  private readonly _world: BarrierWorlds;
  private readonly _output: Output;
  private readonly _sessionId: SessionId;
  private _destroyed: boolean;

  constructor(ctx: Context) {
    this._world = ctx.world.barriers;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
    this._destroyed = false;
  }

  destroy() {
    this._destroyed = true;
    this._world.cancel(this._sessionId);
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case pegasus.TypeNum.KEY_MATCH:
        return this._keyMatch(cmd.keyMatch!);

      case pegasus.TypeNum.SYNC:
        return this._sync(cmd.sync!);

      default:
        throw new Error("Unimplemented barrier command");
    }
  }

  private async _keyMatch(cmd: pegasus.IKeyMatch_Client) {
    const key = cmd.channel! as MatchKey;
    const count = cmd.memberCount!;
    const timeoutSec = cmd.timeoutSec! as TimeoutSec;

    const result = await this._world.match(
      key,
      count,
      timeoutSec,
      this._sessionId
    );

    if (this._destroyed) {
      // Connection died since this method was suspended
      return;
    }

    // I think a not-full lobby is OK here?
    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.KEY_MATCH,
        result: pegasus.ResultEnums.OK,
        keyMatch: new pegasus.KeyMatch_Server({
          channel: key,
          battleID: result.value,
          memberList: result.sessionIds,
        }),
      })
    );
  }

  private async _sync(cmd: pegasus.ISync_Client) {
    const key = cmd.channel! as SyncKey;
    const count = cmd.clientNum!;
    const timeoutSec = cmd.timeout! as TimeoutSec;

    const result = await this._world.sync(
      key,
      count,
      timeoutSec,
      this._sessionId
    );

    if (this._destroyed) {
      // Connection died since this method was suspended
      return;
    }

    // We use this to short-circuit out the payload on failure
    const success = result.count === count || undefined;

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.SYNC,
        result: success ? pegasus.ResultEnums.OK : pegasus.ResultEnums.TIMEOUT,
        sync:
          success &&
          new pegasus.Sync_Server({
            channel: key,
            memberList: result.sessionIds,
          }),
      })
    );
  }
}
