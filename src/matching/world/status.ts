import * as Model from "../model";

export interface StatusGroupMember {
  statusChanged(group: StatusGroup, sessionId: Model.SessionId): void;
}

export class StatusGroup {
  readonly key: Model.StatusKey;
  private _data: Model.StatusData;
  private readonly _members: Map<StatusGroupMember, Model.SessionId>;

  constructor(key: Model.StatusKey) {
    this.key = key;
    this._data = {};
    this._members = new Map();
  }

  isEmpty() {
    return this._members.size == 0;
  }

  data(): Model.StatusData {
    const result = {};

    for (let k in this._data) {
      result[k] = Buffer.from(this._data[k]);
    }

    return result;
  }

  participate(
    member: StatusGroupMember,
    sessionId: Model.SessionId,
    datum: Buffer,
  ) {
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

  datum(sessionId: Model.SessionId): Buffer | undefined {
    const datum = this._data[sessionId];

    return datum && Buffer.from(datum);
  }
}
