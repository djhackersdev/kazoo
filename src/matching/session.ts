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

      case "SUBSCRIBE":
        return this._subscribe(cmd);

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
    const { joinType, groupId, json } = cmd;
    const existing = this._world.locateGroup(groupId);

    if (
      (existing !== undefined && joinType === "create_always") ||
      (existing === undefined && joinType === "create_nothing")
    ) {
      return this._output.write({
        type: "GROUP_CREATE",
        status: "NG",
        groupId,
        memberId: 0 as Model.MemberId,
        json: null,
      });
    }

    const group = existing || this._world.createGroup(groupId, json);
    const memberId = group.join(this, cmd.faction);

    return this._output.write({
      type: "GROUP_CREATE",
      status: "OK",
      groupId,
      memberId,
      json: group.json(),
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

  private _subscribe(cmd: Decoder.SubscribeCommand) {
    const { topicId } = cmd;

    // ???????
    return this._output.write({
      type: "SUBSCRIBE",
      status: "OK",
      topicId,
    });
  }

  jsonChanged(group: Group, memberId: Model.MemberId) {
    this._output.write({
      type: "GROUP_UPDATE_NOTIFY",
      groupId: group.id,
      memberId,
      json: group.json(),
    });
  }

  statusChanged(group: Group, memberId: Model.MemberId) {
    this._output.write({
      type: "STS_NOTIFY",
      groupId: group.id,
      memberId,
      data: group.statusLookup(memberId),
    });
  }
}
