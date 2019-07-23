import { Brand } from "./util";

export type TopicKey = Brand<string, "TopicKey">;

export interface Subscriber {
  topicMessage(topic: Topic, datum: Buffer): void;
}

export class Topic {
  public readonly key: TopicKey;
  private readonly _subs: Map<Subscriber, Buffer | null>;

  constructor(key: TopicKey) {
    this.key = key;
    this._subs = new Map();
  }

  data() {
    const result: Buffer[] = [];

    for (const datum of this._subs.values()) {
      if (datum) {
        result.push(Buffer.from(datum));
      }
    }

    return result;
  }

  isEmpty() {
    return this._subs.size === 0;
  }

  publish(sub: Subscriber, datum: Buffer) {
    if (!this._subs.has(sub)) {
      return;
    }

    this._subs.set(sub, datum);
    this._subs.forEach((_, k) => k.topicMessage(this, datum));
  }

  subscribe(sub: Subscriber) {
    this._subs.set(sub, null);
  }

  unsubscribe(sub: Subscriber) {
    this._subs.delete(sub);
  }
}

export class PubSubWorld {
  private readonly _topics = new Map<TopicKey, Topic>();

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
