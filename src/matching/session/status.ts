import { Context } from "./context";
import * as Model from "../model";
import * as Decoder from "../proto/decoder";
import { Output } from "../proto/pipeline";
import { StatusGroup, StatusGroupMember } from "../world/status";
import { World } from "../world/world";

type StatusCommand = Decoder.StsOpenCommand;

export class StatusSession implements StatusGroupMember {
  private readonly _world: World;
  private readonly _output: Output;
  private readonly _sessionId: Model.SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  destroy() {
    this._world.leaveStatusGroups(this);
  }

  dispatch(cmd: StatusCommand) {
    switch (cmd.type) {
      case "STS_OPEN":
        return this._stsOpen(cmd);

      default:
        throw new Error("Unimplemented status group command");
    }
  }

  private _stsOpen(cmd: Decoder.StsOpenCommand) {
    const { statusId, datum } = cmd;
    const sgroup = this._world.createStatusGroup(statusId);

    sgroup.participate(this, this._sessionId, datum);

    return this._output.write({
      type: "STS_OPEN",
      status: "OK",
      statusId,
      data: sgroup.data(),
    });
  }

  statusChanged(sgroup: StatusGroup, memberId: Model.SessionId) {
    const datum = sgroup.datum(memberId);

    if (datum === undefined) {
      return; // ???
    }

    this._output.write({
      type: "STS_NOTIFY",
      statusId: sgroup.id,
      sessionId: this._sessionId,
      datum,
    });
  }
}
