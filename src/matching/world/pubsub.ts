import * as Model from "../model";

export interface Subscriber {
  topicMessage(topic: Topic, datum: Buffer): void;
}

export class Topic {
  public readonly key: Model.TopicKey;
  private readonly _subs: Map<Subscriber, Buffer | null>;

  constructor(key: Model.TopicKey) {
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
