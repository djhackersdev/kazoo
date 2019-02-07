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
    const { joinType, groupKey, json } = cmd;
    let groups: Group[];
    let group: Group;

    switch (joinType) {
      case "create_nothing":
        // ??? guy meme
        return this._output.write({
          type: "GROUP_CREATE",
          status: "NG",
          groupKey,
          groupId: 0 as Model.GroupId,
          json: null,
        });

      case "auto_join":
        groups = this._world.searchGroups(groupKey);

        if (groups.length > 0) {
          group = groups[0];
        } else {
          group = this._world.createGroup(
            groupKey,
            (this._sessionId as number) as Model.GroupId,
            json,
          );
        }

        break;

      case "create_always":
        group = this._world.createGroup(
          groupKey,
          (this._sessionId as number) as Model.GroupId,
          json,
        );

        break;

      default:
        throw new Error("Invalid joinType");
    }

    group.join(this, cmd.faction, this._sessionId);

    return this._output.write({
      type: "GROUP_CREATE",
      status: "OK",
      groupKey,
      groupId: group.id,
      json: group.json(),
    });
  }

  private _groupSearch(cmd: Decoder.GroupSearchCommand) {
    const { groupKey } = cmd;
    const groups = this._world.searchGroups(cmd.groupKey);
    const json = {};

    for (const group of groups) {
      json[group.id] = group.json();
    }

    return this._output.write({
      type: "GROUP_SEARCH",
      status: "OK",
      groupKey: groupKey,
      json: json,
    });
  }

  groupChanged(group: Group) {
    this._output.write({
      type: "GROUP_UPDATE_NOTIFY",
      groupId: group.key,
      sessionId: this._sessionId,
      json: group.json(),
    });
  }
}
