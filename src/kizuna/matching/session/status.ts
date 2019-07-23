import { pegasus } from "../../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import { SessionId } from "../world/session";
import {
  StatusGroup,
  StatusGroupMember,
  StatusKey,
  StatusWorld,
} from "../world/status";
import { Context } from "./context";

export class StatusSession implements StatusGroupMember {
  private readonly _world: StatusWorld;
  private readonly _output: Output;
  private readonly _sessionId: SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world.status;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  destroy() {
    this._world.leaveStatusGroups(this);
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case pegasus.TypeNum.STS_OPEN:
        return this._stsOpen(cmd.stsOpen!);

      case pegasus.TypeNum.STS_SET:
        return this._stsSet(cmd.stsSet!);

      case pegasus.TypeNum.STS_CLOSE:
        return this._stsClose(cmd.stsClose!);

      default:
        throw new Error("Unimplemented status group command");
    }
  }

  private _stsOpen(cmd: pegasus.ISTSOpen_Client) {
    const key = cmd.channel! as StatusKey;
    const datum = Buffer.from(cmd.value!);

    const sgroup = this._world.createStatusGroup(key);

    sgroup.participate(this, this._sessionId, datum);

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.STS_OPEN,
        result: pegasus.ResultEnums.OK,
        stsOpen: new pegasus.STSOpen_Server({
          channel: key,
          nodes: sgroup.data(),
        }),
      })
    );
  }

  private _stsSet(cmd: pegasus.ISTSSet) {
    const key = cmd.channel! as StatusKey;
    const datum = Buffer.from(cmd.value!);

    const sgroup = this._world.createStatusGroup(key);

    sgroup.participate(this, this._sessionId, datum);

    // Not explicitly acked, this will generate a STS_NOTIFY though.
  }

  private _stsClose(cmd: pegasus.ISTSClose_Client) {
    const key = cmd.channel! as StatusKey;

    // Will cause a destruction notification if we were joined
    this._world.destroyStatusGroup(key);
  }

  statusChanged(sgroup: StatusGroup, memberId: SessionId) {
    const datum = sgroup.datum(memberId);

    if (datum === undefined) {
      return; // ???
    }

    this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.STS_NOTIFY,
        stsNotify: new pegasus.STSNotify({
          channel: sgroup.key,
          sid: memberId,
          value: datum,
        }),
      })
    );
  }

  statusDestroyed(sgroup: StatusGroup) {
    this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.STS_CLOSE,
        stsClose: new pegasus.STSClose_Server({
          channel: sgroup.key,
        }),
      })
    );
  }
}
