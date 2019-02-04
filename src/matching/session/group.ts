import { Context } from "./context";
import * as Model from "../model";
import { Output } from "../proto/pipeline";
import * as Decoder from "../proto/decoder";
import { Group, GroupMember } from "../world/group";
import { World } from "../world/world";

type GroupCommand = Decoder.GroupCreateCommand | Decoder.GroupSearchCommand;

export class GroupSession implements GroupMember {
  private readonly _world: World;
  private readonly _output: Output;
  private readonly _sessionId: Model.SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  destroy() {
    this._world.leaveGroups(this);
  }

  dispatch(cmd: GroupCommand) {
    switch (cmd.type) {
      case "GROUP_CREATE":
        return this._groupCreate(cmd);

      case "GROUP_SEARCH":
        return this._groupSearch(cmd);

      default:
        throw new Error("Unimplemented group command");
    }
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
        sessionId: this._sessionId,
        json: null,
      });
    }

    const group = existing || this._world.createGroup(groupId, json);

    if (joinType === "auto_join") {
      group.join(this, cmd.faction, this._sessionId);
    }

    return this._output.write({
      type: "GROUP_CREATE",
      status: "OK",
      groupId,
      sessionId: this._sessionId,
      json: group.json(),
    });
  }

  private _groupSearch(cmd: Decoder.GroupSearchCommand) {
    const { groupId } = cmd;
    const existing = this._world.locateGroup(cmd.groupId);

    return this._output.write({
      type: "GROUP_SEARCH",
      status: "OK",
      groupId,
      json: existing ? { 1: existing.json() } : {},
    });
  }

  groupChanged(group: Group) {
    this._output.write({
      type: "GROUP_UPDATE_NOTIFY",
      groupId: group.id,
      sessionId: this._sessionId,
      json: group.json(),
    });
  }
}
