import * as Model from "../model";

export interface GroupMember {
  groupChanged(group: Group): void;
}

export class Group {
  readonly id: Model.GroupId;
  private _json: Model.GroupJson;
  private readonly _members: Map<GroupMember, Model.SessionId>;

  constructor(id: Model.GroupId, create: Model.GroupCreateJson) {
    const { max, attr } = create;

    this.id = id;
    this._json = { max, attr, member: [[], []] };
    this._members = new Map();
  }

  isEmpty() {
    return this._members.size == 0;
  }

  json(): Readonly<Model.GroupJson> {
    return this._json;
  }

  join(
    member: GroupMember,
    factionCode: Model.FactionCode,
    sessionId: Model.SessionId,
  ) {
    const sessionIds = this._json.member[factionCode];

    if (sessionIds.includes(sessionId)) {
      return; // nothing to do
    }

    // Sloppy, we mutate the attribute object in-place here.

    sessionIds.push(sessionId);

    // I think we need to join after the join notification has been sent to the
    // existing members, otherwise the notification stream will be a little
    // weird.

    this._members.forEach((_, k) => k.groupChanged(this));
    this._members.set(member, sessionId);
  }

  leave(member: GroupMember) {
    const sessionId = this._members.get(member);

    if (sessionId === undefined) {
      return; // nothing to do
    }

    const sessionIdLists = this._json.member;

    for (let i = 0; i < sessionIdLists.length; i++) {
      sessionIdLists[i] = sessionIdLists[i].filter(id => id !== sessionId);
    }

    this._members.delete(member);

    // Send leave notification after member has left I think

    this._members.forEach((_, k) => k.groupChanged(this));
  }
}
