import { Brand } from "./util";

export type KvsKey = Brand<string, "KvsKey">;
export type KvsTopic = Brand<string, "KvsTopic">;

export interface KvsData {
  [key: string]: Buffer;
}

export interface KvsMember {
  kvsChanged(kvs: KeyValueSet, key: KvsKey): void;
}

export class KeyValueSet {
  readonly topic: KvsTopic;

  private readonly _data: Map<KvsKey, Buffer>;
  private readonly _members: Set<KvsMember>;

  constructor(topic: KvsTopic) {
    this.topic = topic;
    this._data = new Map();
    this._members = new Set();
  }

  isEmpty() {
    return this._members.size === 0;
  }

  data() {
    const result: KvsData = {};

    this._data.forEach((v, k) => (result[k] = Buffer.from(v)));

    return result;
  }

  datum(key: KvsKey): Buffer {
    const datum = this._data.get(key);

    if (datum === undefined) {
      throw new ReferenceError();
    }

    return Buffer.from(datum);
  }

  _join(member: KvsMember) {
    this._members.add(member);
  }

  _leave(member: KvsMember) {
    this._members.delete(member);
  }

  _set(key: KvsKey, value: Uint8Array) {
    this._data.set(key, Buffer.from(value));
    this._members.forEach(member => member.kvsChanged(this, key));
  }
}

export class KeyValueWorld {
  private readonly _sets: Map<KvsTopic, KeyValueSet> = new Map();

  join(topic: KvsTopic, member: KvsMember) {
    const existing = this._sets.get(topic);
    let set: KeyValueSet;

    if (existing !== undefined) {
      set = existing;
    } else {
      set = new KeyValueSet(topic);
      this._sets.set(topic, set);
    }

    set._join(member);

    return set;
  }

  leave(topic: KvsTopic, member: KvsMember) {
    const set = this._sets.get(topic);

    if (set === undefined) {
      return;
    }

    set._leave(member);

    if (set.isEmpty()) {
      this._sets.delete(topic);
      console.log(`Matching: Key-value set ${topic} GCed due to leave cmd`);
    }
  }

  leaveAll(member: KvsMember) {
    const condemned: KvsTopic[] = [];

    this._sets.forEach((set, topic) => {
      set._leave(member);

      if (set.isEmpty()) {
        condemned.push(topic);
      }
    });

    condemned.forEach(topic => this._sets.delete(topic));
    condemned.forEach(topic =>
      console.log(`Matching: Key-value set ${topic} GCed due to disconnect`)
    );
  }

  set(topic: KvsTopic, key: KvsKey, val: Uint8Array) {
    const set = this._sets.get(topic);

    if (set === undefined) {
      throw new ReferenceError(`No such KeyValueSet: ${topic}`);
    }

    set._set(key, val);
  }
}
