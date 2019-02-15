import Long = require("long");

import { pegasus } from "../../../generated/pegasus";
import { Context } from "./context";
import { Output } from "../proto/pipeline";
import {
  Faction,
  Group,
  GroupId,
  GroupKey,
  GroupMember,
  GroupWorld,
} from "../world/group";
import { SessionId } from "../world/session";

const factionNames: Faction[] = ["efsf", "zeon"];

function extractId(val: number | Long | null | undefined): GroupId {
  if (val === null || val === undefined) {
    throw new ReferenceError("Group ID missing");
  } else if (val instanceof Long) {
    return val.toNumber() as GroupId;
  } else {
    return val as GroupId;
  }
}

function writeGroupInfo(group: Group): pegasus.GroupInfo {
  return new pegasus.GroupInfo({
    slotList: factionNames.map(key => ({
      maxCount: group.spec.max[key],
      memberList: group.state[key],
    })),
    attr: group.spec.attr,
    filter: [],
    owner: group.spec.owner,
  });
}

export class GroupSession implements GroupMember {
  private readonly _world: GroupWorld;
  private readonly _output: Output;
  private readonly _sessionId: SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world.groups;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  destroy() {
    this._world.leaveGroups(this);
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case pegasus.TypeNum.GROUP_CREATE:
        return this._groupCreate(cmd.groupCreate!);

      case pegasus.TypeNum.GROUP_SEARCH:
        return this._groupSearch(cmd.groupSearch!);

      case pegasus.TypeNum.GROUP_CLOSE:
        return this._groupClose(cmd.groupClose!);

      case pegasus.TypeNum.GROUP_JOIN:
        return this._groupJoin(cmd.groupJoin!);

      default:
        throw new Error("Unimplemented group command");
    }
  }

  private _groupCreate(cmd: pegasus.IGroupCreate_Client) {
    const key = cmd.channel! as GroupKey;
    const faction = factionNames[cmd.slotNo!] as Faction;
    const attr = cmd.info!.attr!;
    const slotList = cmd.info!.slotList!;

    const spec = {
      owner: this._sessionId,
      attr,
      max: {
        efsf: slotList[0].maxCount!,
        zeon: slotList[1].maxCount!,
      },
    };

    // Do something smarter than just taking the first possible group for a
    // multi-location server obviously. We should pay attention to the group
    // maximums, for one thing.

    const existing: Group | undefined = this._world.searchGroups(key)[0];
    let group: Group | undefined;

    switch (cmd.createMode) {
      case pegasus.GroupCreateModeEnums.GC_AUTOJOIN:
        if (existing !== undefined) {
          group = existing;
        } else {
          group = this._world.createGroup(key, spec);
        }

        break;

      case pegasus.GroupCreateModeEnums.GC_CREATEALWAYS:
        group = this._world.createGroup(key, spec);

        break;

      case pegasus.GroupCreateModeEnums.GC_CREATENOTHING:
        group = existing;

        break;

      default:
        throw new Error("Invalid createMode");
    }

    if (group === undefined) {
      return this._output.write(
        new pegasus.Command_Server({
          type: pegasus.TypeNum.GROUP_CREATE,
          result: pegasus.ResultEnums.FAIL,
        })
      );
    }

    group.join(this, faction, this._sessionId);

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.GROUP_CREATE,
        result: pegasus.ResultEnums.OK,
        groupCreate: new pegasus.GroupCreate_Server({
          channel: group.key,
          groupID: group.id,
          info: writeGroupInfo(group),
        }),
      })
    );
  }

  private _groupSearch(cmd: pegasus.IGroupSearch_Client) {
    const key = cmd.channel as GroupKey;
    const groups = this._world.searchGroups(key);

    const groupList = {};

    for (const group of groups) {
      groupList[group.id] = writeGroupInfo(group);
    }

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.GROUP_SEARCH,
        result: pegasus.ResultEnums.OK,
        groupSearch: new pegasus.GroupSearch_Server({
          channel: key,
          groupList,
        }),
      })
    );
  }

  private _groupClose(cmd: pegasus.IGroupClose) {
    const id = extractId(cmd.groupID);

    // Causes groupDestroyed notification if we were a member (which we really
    // ought to have been!)
    this._world.destroyGroup(id);
  }

  private _groupJoin(cmd: pegasus.IGroupJoin_Client) {
    const id = extractId(cmd.groupID);
    let faction = factionNames[cmd.slotNo!];

    if (faction === undefined) {
      console.log("Missing faction code???", cmd.slotNo);
      faction = "efsf";
    }

    const group = this._world.existingGroup(id);

    if (group === undefined) {
      return this._output.write(
        new pegasus.Command_Server({
          type: pegasus.TypeNum.GROUP_JOIN,
          result: pegasus.ResultEnums.FAIL,
        })
      );
    }

    // Might want to check member limits inside class Group...
    group.join(this, faction, this._sessionId);

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.GROUP_JOIN,
        result: pegasus.ResultEnums.OK,
        groupJoin: new pegasus.GroupJoin_Server({
          channel: group.key,
          groupID: group.id,
          info: writeGroupInfo(group),
        }),
      })
    );
  }

  groupChanged(group: Group) {
    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.GROUP_UPDATE_NOTIFY,
        groupUpdateNotify: new pegasus.GroupUpdateNotify({
          channel: group.key,
          groupID: group.id,
          info: writeGroupInfo(group),
        }),
      })
    );
  }

  groupDestroyed(group: Group) {
    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.GROUP_CLOSE_NOTIFY,
        groupCloseNotify: new pegasus.GroupCloseNotify({
          channel: group.key,
          groupID: group.id,
          info: writeGroupInfo(group),
        }),
      })
    );
  }
}
