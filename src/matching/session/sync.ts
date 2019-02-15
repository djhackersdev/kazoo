import { pegasus } from "../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import { SessionId } from "../world/session";
import { SyncKey, SyncWorld, TimeoutSec } from "../world/sync";
import { Context } from "./context";

export class SyncSession {
  private readonly _world: SyncWorld;
  private readonly _output: Output;
  private readonly _sessionId: SessionId;
  private _destroyed: boolean;

  constructor(ctx: Context) {
    this._world = ctx.world.sync;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
    this._destroyed = false;
  }

  destroy() {
    this._destroyed = true;
    this._world.desync(this._sessionId);
  }

  dispatch(cmd: pegasus.Command_Client) {
    if (cmd.type !== pegasus.TypeNum.SYNC) {
      throw new Error("Misrouted command!");
    }

    this._sync(cmd.sync!);
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
