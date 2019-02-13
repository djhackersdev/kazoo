import { Group, GroupId, GroupKey, GroupMember, GroupSpec } from "./group";
import { Topic, TopicKey, Subscriber } from "./pubsub";
import { StatusGroup, StatusGroupMember, StatusKey } from "./status";

export class World {
  private _nextGroupId = 100;
  private _groups: Group[] = [];
  private readonly _sgroups = new Map<StatusKey, StatusGroup>();
  private readonly _topics = new Map<TopicKey, Topic>();

  createGroup(key: GroupKey, spec: GroupSpec): Group {
    const id = this._nextGroupId++ as GroupId;
    const group = new Group(key, id, spec);

    this._groups.push(group);

    return group;
  }

  searchGroups(key: GroupKey): Group[] {
    return this._groups.filter(group => group.key === key);
  }

  leaveGroups(member: GroupMember) {
    this._groups.forEach(group => group.leave(member));

    const condemned = this._groups.filter(group => group.isEmpty());

    this._groups = this._groups.filter(group => !group.isEmpty());

    condemned.forEach(group =>
      console.log(`Matching: Group ${group.key} ${group.id} GCed`)
    );
  }

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

  existingTopic(id: TopicKey): Topic | undefined {
    return this._topics.get(id);
  }

  topic(key: TopicKey): Topic {
    const existing = this._topics.get(key);
    const topic = existing || new Topic(key);

    this._topics.set(key, topic);

    return topic;
  }

  leaveTopics(sub: Subscriber) {
    const condemned: TopicKey[] = [];

    this._topics.forEach((topic, topicKey) => {
      topic.unsubscribe(sub);

      if (topic.isEmpty()) {
        condemned.push(topicKey);
      }
    });

    condemned.forEach(topicKey => this._topics.delete(topicKey));
    condemned.forEach(topicKey =>
      console.log(`Matching: Topic ${topicKey} GCed`)
    );
  }
}
