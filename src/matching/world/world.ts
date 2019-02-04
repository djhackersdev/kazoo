import { Group, GroupMember } from "./group";
import { Topic, Subscriber } from "./pubsub";
import { StatusGroup, StatusGroupMember } from "./status";
import * as Model from "../model";

export class World {
  private readonly _groups = new Map<Model.GroupId, Group>();
  private readonly _sgroups = new Map<Model.StatusId, StatusGroup>();
  private readonly _topics = new Map<Model.TopicId, Topic>();

  createGroup(id: Model.GroupId, create: Model.GroupCreateJson): Group {
    const existing = this._groups.get(id);
    const group = existing || new Group(id, create);

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
    condemned.forEach(groupId =>
      console.log(`Matching: Group ${groupId} GCed`),
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
