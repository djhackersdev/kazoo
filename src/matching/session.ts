import { Group, GroupMember } from "./group";
import { Logger } from "./logger";
import * as Model from "./model";
import * as Decoder from "./decoder";
import { Output } from "./pipeline";
import { World } from "./world";

interface Options {
  world: World;
  output: Output;
  logger: Logger;
}

export class Session implements GroupMember {
  private readonly _world: World;
  private readonly _output: Output;
  private readonly _logger: Logger;

  constructor(op: Options) {
    this._world = op.world;
    this._output = op.output;
    this._logger = op.logger;
  }

  destroy() {
    this._world.leaveGroups(this);
  }

  dispatch(cmd: Decoder.Command) {
    switch (cmd.type) {
      case "HELLO":
        return this._hello();

      case "PING":
        return this._output.write({ type: "PONG" });

      case "CLIENTLOG":
        return this._output.write({ type: "CLIENTLOG", status: "OK" });

      case "GROUP_CREATE":
        return this._groupCreate(cmd);

      case "STS_OPEN":
        return this._stsOpen(cmd);

      default:
        throw new Error("Unsupported command");
    }
  }

  private _hello() {
    return this._output.write({
      type: "HELLO",
      status: "OK",
      json: {
        time: new Date().toISOString(),
        majorVer: 57,
        minorVer: 7,
        localVer: 35707,
        sessionId: 1234,
      },
    });
  }

  private _groupCreate(cmd: Decoder.GroupCreateCommand) {
    if (cmd.joinType !== "auto_join") {
      throw new Error("Join type not implemented");
    }

    const { groupId, json } = cmd;
    const { max, attr } = json;

    const existing = this._world.locateGroup(groupId);
    const group = existing || this._world.createGroup(groupId, max);

    if (!existing) {
      // Initialize attrs in new group
      group.update(attr);
    }

    const memberId = group.join(this, cmd.faction);

    return this._output.write({
      type: "GROUP_CREATE",
      status: "OK",
      groupId,
      memberId,
      json: {
        max: group.max(),
        attr: group.attrs(), // Get attrs enhanced with member list
      },
    });
  }

  private _stsOpen(cmd: Decoder.StsOpenCommand) {
    const { groupId, data } = cmd;
    const group = this._world.locateGroup(groupId);

    try {
      if (group === undefined) {
        throw new Error("Attempted to STS_OPEN nonexistent group");
      }

      group.statusOpen(this, data); // might throw

      return this._output.write({
        type: "STS_OPEN",
        status: "OK",
        groupId: groupId,
        groupStatus: group.status(),
      });
    } catch (e) {
      this._logger.log(e);

      return this._output.write({
        type: "STS_OPEN",
        status: "NG",
        groupId: groupId,
        groupStatus: null,
      });
    }
  }

  attrsChanged(group: Group, memberId: Model.MemberId) {
    console.log("*** TODO ATTRSCHANGED ***");
  }

  statusChanged(group: Group) {
    console.log("*** TODO STATUSCHANGED ***");
  }
}
