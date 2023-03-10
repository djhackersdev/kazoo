import { SessionId } from "./session";
import { Brand } from "./util";

export type Faction = "efsf" | "zeon";
export type GroupKey = Brand<string, "GroupKey">;
export type GroupId = Brand<number, "GroupId">;

export interface GroupFaction {
  max: number;
  members: SessionId[];
}

export interface GroupSpec {
  owner: SessionId;
  attr: { [key: string]: string };
  max: {
    efsf: number;
    zeon: number;
  };
}

export interface GroupState {
  efsf: SessionId[];
  zeon: SessionId[];
}

export interface GroupMember {
  groupChanged(group: Group): void;
  groupDestroyed(group: Group): void;
}

export class Group {
  readonly key: GroupKey;
  readonly id: GroupId;
  readonly spec: GroupSpec;

  private _state: Readonly<GroupState>;
  private readonly _memberObjs: Map<GroupMember, SessionId>;

  constructor(key: GroupKey, id: GroupId, spec: Readonly<GroupSpec>) {
    this.id = id;
    this.key = key;
    this.spec = spec;
    this._state = { efsf: [], zeon: [] };
    this._memberObjs = new Map();
  }

  isEmpty() {
    return this._memberObjs.size == 0;
  }

  get state(): Readonly<GroupState> {
    return this._state;
  }

  join(member: GroupMember, faction: Faction, sessionId: SessionId) {
    const members = this._state[faction];

    if (members.includes(sessionId)) {
      return; // nothing to do
    }

    this._state = {
      ...this._state,
      [faction]: [...members, sessionId],
    };

    // I think we need to join after the join notification has been sent to the
    // existing members, otherwise the notification stream will be a little
    // weird.

    this._memberObjs.forEach((_, k) => k.groupChanged(this));
    this._memberObjs.set(member, sessionId);
  }

  leave(member: GroupMember) {
    const sessionId = this._memberObjs.get(member);

    if (sessionId === undefined) {
      return; // nothing to do
    }

    const tmp = {} as GroupState;

    for (const k in this._state) {
      tmp[k] = this._state[k].filter(item => item !== sessionId);
    }

    this._state = tmp;
    this._memberObjs.delete(member);

    // Send leave notification after member has left I think

    this._memberObjs.forEach((_, k) => k.groupChanged(this));
  }

  destroy() {
    this._memberObjs.forEach((_, k) => k.groupDestroyed(this));

    this._state = { efsf: [], zeon: [] };
    this._memberObjs.clear();
  }
}

export class GroupWorld {
  private _nextGroupId = 100;
  private _groups: Group[] = [];

  createGroup(key: GroupKey, spec: GroupSpec): Group {
    const id = this._nextGroupId++ as GroupId;
    const group = new Group(key, id, spec);

    this._groups.push(group);

    return group;
  }

  searchGroups(key: GroupKey): Group[] {
    return this._groups.filter(group => group.key === key);
  }

  existingGroup(id: GroupId): Group | undefined {
    return this._groups.find(group => group.id === id);
  }

  leaveGroups(member: GroupMember) {
    this._groups.forEach(group => group.leave(member));

    const condemned = this._groups.filter(group => group.isEmpty());

    this._groups = this._groups.filter(group => !group.isEmpty());

    condemned.forEach(group =>
      console.log(`Matching: Group ${group.key} ${group.id} GCed`)
    );
  }

  destroyGroup(id: GroupId) {
    const condemned = this._groups.filter(item => item.id === id);

    this._groups = this._groups.filter(item => item.id !== id);

    condemned.forEach(item => {
      console.log(
        `Matching: Group ${item.key} ${item.id} explicitly destroyed!`
      );

      item.destroy();
    });
  }
}
