import { pegasus } from "../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import {
  Faction,
  Group,
  GroupId,
  GroupKey,
  GroupMember,
} from "../world/group";
import { SessionId } from "../world/session";
import { World } from "../world/world";
import { Context } from "./context";

const factionNames: Faction[] = ["efsf", "zeon"];

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
  private readonly _world: World;
  private readonly _output: Output;
  private readonly _sessionId: SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world;
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
}
