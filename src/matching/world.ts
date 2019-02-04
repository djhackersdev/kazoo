import { Group, GroupMember } from "./group";
import * as Model from "./model";

export class World {
  private _groups = new Map<Model.GroupId, Group>();

  createGroup(id: Model.GroupId, create: Model.GroupCreateJson): Group {
    if (this._groups.has(id)) {
      throw new Error("Group already exists");
    }

    const group = new Group(id, create);

    this._groups.set(id, group);

    return group;
  }

  locateGroup(id: Model.GroupId): Group | undefined {
    return this._groups.get(id);
  }

  leaveGroups(member: GroupMember) {
    const condemned: Model.GroupId[] = [];

    this._groups.forEach((group, groupId) => {
      group.leave(member);

      if (group.isEmpty()) {
        condemned.push(groupId);
      }
    });

    condemned.forEach(groupId => this._groups.delete(groupId));
  }
}
