import { Group, GroupMember } from "./group";
import { Topic, Subscriber } from "./pubsub";
import { StatusGroup, StatusGroupMember } from "./status";
import * as Model from "../model";

export class World {
  private _nextGroupId = 100;
  private _groups: Group[] = [];
  private readonly _sgroups = new Map<Model.StatusId, StatusGroup>();
  private readonly _topics = new Map<Model.TopicId, Topic>();

  createGroup(
    key: Model.GroupKey,
    id: Model.GroupId,
    create: Model.GroupCreateJson,
  ): Group {
    //const id = this._nextGroupId++ as Model.GroupId;
    const group = new Group(key, id, create);

    this._groups.push(group);

    return group;
  }

  searchGroups(key: Model.GroupKey): Group[] {
    return this._groups.filter(group => group.key === key);
  }

  leaveGroups(member: GroupMember) {
    this._groups.forEach(group => group.leave(member));

    const condemned = this._groups.filter(group => group.isEmpty());

    this._groups = this._groups.filter(group => !group.isEmpty());

    condemned.forEach(group =>
      console.log(`Matching: Group ${group.key} ${group.id} GCed`),
    );
  }

  createStatusGroup(id: Model.StatusId): StatusGroup {
    const existing = this._sgroups.get(id);
    const sgroup = existing || new StatusGroup(id);

    this._sgroups.set(id, sgroup);

    return sgroup;
  }

  leaveStatusGroups(member: StatusGroupMember) {
    const condemned: Model.StatusId[] = [];

    this._sgroups.forEach((sgroup, statusId) => {
      sgroup.leave(member);

      if (sgroup.isEmpty()) {
        condemned.push(statusId);
      }
    });

    condemned.forEach(statusId => this._sgroups.delete(statusId));
    condemned.forEach(statusId =>
      console.log(`Matching: Status group ${statusId} GCed`),
    );
  }

  existingTopic(id: Model.TopicId): Topic | undefined {
    return this._topics.get(id);
  }

  topic(id: Model.TopicId): Topic {
    const existing = this._topics.get(id);
    const topic = existing || new Topic(id);

    this._topics.set(id, topic);

    return topic;
  }

  leaveTopics(sub: Subscriber) {
    const condemned: Model.TopicId[] = [];

    this._topics.forEach((topic, topicId) => {
      topic.unsubscribe(sub);

      if (topic.isEmpty()) {
        condemned.push(topicId);
      }
    });

    condemned.forEach(topicId => this._topics.delete(topicId));
    condemned.forEach(topicId =>
      console.log(`Matching: Topic ${topicId} GCed`),
    );
  }
}
