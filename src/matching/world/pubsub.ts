import * as Model from "../model";

export interface Subscriber {
  topicMessage(topic: Topic, datum: Buffer): void;
}

export class Topic {
  public readonly id: Model.TopicId;
  private readonly _subs: Set<Subscriber>;

  constructor(id: Model.TopicId) {
    this.id = id;
    this._subs = new Set();
  }

  isEmpty() {
    return this._subs.size === 0;
  }

  publish(datum: Buffer) {
    this._subs.forEach(sub => sub.topicMessage(this, datum));
  }

  subscribe(sub: Subscriber) {
    this._subs.add(sub);
  }

  unsubscribe(sub: Subscriber) {
    this._subs.delete(sub);
  }
}
