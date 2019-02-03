import { Group, GroupMember } from "./group";
import * as Model from "./model";

export class World {
  private _groups = new Map<Model.GroupId, Group>();

  createGroup(id: Model.GroupId, max: number[]): Group {
    if (this._groups.has(id)) {
      throw new Error("Group already exists");
    }

    const group = new Group(id, max);

    this._groups.set(id, group);

    return group;
  }

  locateGroup(id: Model.GroupId): Group | undefined {
    return this._groups.get(id);
  }

  leaveGroups(member: GroupMember) {
    this._groups.forEach(group => group.leave(member));
  }
}
