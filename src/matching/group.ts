import * as Model from "./model";

export interface GroupMember {
  jsonChanged(group: Group, memberId: Model.MemberId): void;
  statusChanged(group: Group, memberId: Model.MemberId): void;
}

export class Group {
  readonly id: Model.GroupId;

  private _json: Model.GroupJson;
  private _status: Model.GroupStatus;

  private readonly _members: Map<GroupMember, Model.MemberId>;
  private readonly _statusListeners: Set<GroupMember>;

  private _nextMemberId: Model.MemberId;

  constructor(id: Model.GroupId, create: Model.GroupCreateJson) {
    const { max, attr } = create;

    this.id = id;
    this._json = { max, attr, member: [[], []] };
    this._status = {};
    this._members = new Map();
    this._statusListeners = new Set();
    this._nextMemberId = 100 as Model.MemberId;
  }

  isEmpty() {
    return this._members.size == 0 && this._statusListeners.size == 0;
  }

  json(): Readonly<Model.GroupJson> {
    return this._json;
  }

  status(): Readonly<Model.GroupStatus> {
    return { ...this._status };
  }

  join(member: GroupMember, factionCode: Model.FactionCode): Model.MemberId {
    if (this._members.has(member)) {
      throw new Error("Already joined!");
    }

    const memberId = this._nextMemberId++ as Model.MemberId;
    const memberIdLists = this._json.member;

    // Sloppy, we mutate the attribute object in-place here.

    memberIdLists[factionCode].push(memberId);

    // I think we need to join after the join notification has been sent to the
    // existing members, otherwise the notification stream will be a little
    // weird.

    this._members.forEach((v, k) => k.jsonChanged(this, v));
    this._members.set(member, memberId);

    return memberId;
  }

  leave(member: GroupMember) {
    const memberId = this._members.get(member);

    if (memberId === undefined) {
      return; // nothing to do
    }

    const memberIdLists = this._json.member;

    if (memberIdLists !== undefined) {
      for (let i = 0; i < memberIdLists.length; i++) {
        memberIdLists[i] = memberIdLists[i].filter(id => id !== memberId);
      }
    }

    this._members.delete(member);
    this._statusListeners.delete(member);

    // Send leave notification after member has left I think

    this._members.forEach((v, k) => k.jsonChanged(this, v));
  }

  statusOpen(member: GroupMember, src: Buffer) {
    const memberId = this._members.get(member);

    if (memberId === undefined) {
      throw new Error("Must join group before opening status");
    }

    // Re-opening seems harmless since no IDs get leaked

    this._status[memberId] = Buffer.from(src);
    this._statusListeners.forEach(item => item.statusChanged(this, memberId));
    this._statusListeners.add(member);
  }

  statusLookup(memberId: Model.MemberId): Buffer {
    const data = this._status[memberId];

    if (data === undefined) {
      throw new Error("No status data for requested member");
    }

    return Buffer.from(data);
  }
}
