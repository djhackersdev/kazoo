import * as Model from "./model";

export interface GroupMember {
  attrsChanged(group: Group, memberId: Model.MemberId): void;
  statusChanged(group: Group): void;
}

export class Group {
  readonly id: string;
  private _max: number[];
  private _attrs: Model.GroupAttrs;
  private _status: Model.GroupStatus;
  private readonly _members: Map<GroupMember, Model.MemberId>;
  private readonly _statusListeners: Set<GroupMember>;
  private _nextMemberId: Model.MemberId;

  constructor(id: string, max: number[]) {
    this.id = id;
    this._max = max;
    this._attrs = { member: [[], []] };
    this._status = {};
    this._members = new Map();
    this._statusListeners = new Set();
    this._nextMemberId = 100 as Model.MemberId;
  }

  max(): Readonly<number[]> {
    return this._max;
  }

  attrs(): Readonly<Model.GroupAttrs> {
    return this._attrs;
  }

  status(): Readonly<Model.GroupStatus> {
    return { ...this._status };
  }

  join(member: GroupMember, factionCode: Model.FactionCode): Model.MemberId {
    if (this._members.has(member)) {
      throw new Error("Already joined!");
    }

    const memberId = this._nextMemberId++ as Model.MemberId;
    const memberIdLists = this._attrs.member;

    // Sloppy, we mutate the attribute object in-place here.

    if (memberIdLists !== undefined) {
      memberIdLists[factionCode].push(memberId);
    }

    // I think we need to join after the join notification has been sent to the
    // existing members, otherwise the notification stream will be a little
    // weird.

    this._members.forEach((v, k) => k.attrsChanged(this, v));
    this._members.set(member, memberId);

    return memberId;
  }

  update(attrs: Model.GroupAttrs) {
    this._attrs = { ...this._attrs, ...attrs };
    this._members.forEach((v, k) => k.attrsChanged(this, v));
  }

  leave(member: GroupMember) {
    const memberId = this._members.get(member);

    if (memberId === undefined) {
      return; // nothing to do
    }

    const memberIdLists = this._attrs.member;

    if (memberIdLists !== undefined) {
      for (let i = 0; i < memberIdLists.length; i++) {
        memberIdLists[i] = memberIdLists[i].filter(id => id !== memberId);
      }
    }

    this._members.delete(member);
    this._statusListeners.delete(member);

    // Send leave notification after member has left I think

    this._members.forEach((v, k) => k.attrsChanged(this, v));
  }

  statusOpen(member: GroupMember, src: Buffer) {
    const memberId = this._members.get(member);

    if (memberId === undefined) {
      throw new Error("Must join group before opening status");
    }

    // Re-opening seems harmless since no IDs get leaked

    this._status[memberId.toString()] = Buffer.from(src);
    this._statusListeners.forEach(item => item.statusChanged(this));
    this._statusListeners.add(member);
  }
}
