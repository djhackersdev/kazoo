import { SessionId } from "./session";
import { Brand } from "./util";

export type StatusKey = Brand<string, "StatusKey">;

export interface StatusData {
  [key: string]: Buffer;
}

export interface StatusGroupMember {
  statusChanged(group: StatusGroup, sessionId: SessionId): void;

  statusDestroyed(group: StatusGroup);
}

export class StatusGroup {
  readonly key: StatusKey;
  private _data: StatusData;
  private readonly _members: Map<StatusGroupMember, SessionId>;

  constructor(key: StatusKey) {
    this.key = key;
    this._data = {};
    this._members = new Map();
  }

  isEmpty() {
    return this._members.size == 0;
  }

  data(): StatusData {
    const result = {};

    for (let k in this._data) {
      result[k] = Buffer.from(this._data[k]);
    }

    return result;
  }

  participate(member: StatusGroupMember, sessionId: SessionId, datum: Buffer) {
    this._data[sessionId] = Buffer.from(datum);
    this._members.forEach((_, k) => k.statusChanged(this, sessionId));
    this._members.set(member, sessionId);
  }

  leave(member: StatusGroupMember) {
    const sessionId = this._members.get(member);

    if (sessionId === undefined) {
      return;
    }

    delete this._data[sessionId];
    this._members.delete(member);
    this._members.forEach((_, k) => k.statusChanged(this, sessionId));
  }

  destroy() {
    this._members.forEach((_, k) => k.statusDestroyed(this));
    this._members.clear();
  }

  datum(sessionId: SessionId): Buffer | undefined {
    const datum = this._data[sessionId];

    return datum && Buffer.from(datum);
  }
}

export class StatusWorld {
  private readonly _sgroups = new Map<StatusKey, StatusGroup>();

  createStatusGroup(key: StatusKey): StatusGroup {
    const existing = this._sgroups.get(key);
    const sgroup = existing || new StatusGroup(key);

    this._sgroups.set(key, sgroup);

    return sgroup;
  }

  leaveStatusGroups(member: StatusGroupMember) {
    const condemned: StatusKey[] = [];

    this._sgroups.forEach((sgroup, statusKey) => {
      sgroup.leave(member);

      if (sgroup.isEmpty()) {
        condemned.push(statusKey);
      }
    });

    condemned.forEach(statusKey => this._sgroups.delete(statusKey));
    condemned.forEach(statusKey =>
      console.log(`Matching: Status group ${statusKey} GCed`)
    );
  }

  destroyStatusGroup(id: StatusKey) {
    const condemned = this._sgroups.get(id);

    this._sgroups.delete(id);

    if (condemned !== undefined) {
      console.log(
        `Matching: Status group ${condemned.key} explicitly destroyed!`
      );

      condemned.destroy();
    }
  }
}
