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
}
