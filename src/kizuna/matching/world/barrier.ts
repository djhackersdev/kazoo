import { SessionId } from "./session";
import { Brand } from "./util";

export type MatchId = Brand<number, "MatchId">;
export type MatchKey = Brand<string, "MatchKey">;
export type SyncKey = Brand<string, "SyncKey">;
export type TimeoutSec = Brand<number, "TimeoutSec">;

export class Barrier<T> {
  public readonly count: number;
  public readonly value: T;

  private readonly _promise: Promise<Barrier<T>>;
  private readonly _sessionIds: Set<SessionId>;

  private _resolve: (self: Barrier<T>) => void;

  constructor(count: number, timeoutSec: TimeoutSec, value: T) {
    this.count = count;
    this.value = value;
    this._promise = new Promise(resolve => (this._resolve = resolve));
    this._sessionIds = new Set();

    global.setTimeout(() => this._resolve(this), timeoutSec * 1000);
  }

  join(sessionId: SessionId) {
    this._sessionIds.add(sessionId);

    if (this._sessionIds.size >= this.count) {
      this._resolve(this);
    }
  }

  // This will be invoked if a session is aborted prior to resolution
  leave(sessionId: SessionId) {
    this._sessionIds.delete(sessionId);
  }

  get promise(): Promise<Barrier<T>> {
    return this._promise;
  }

  get sessionIds(): SessionId[] {
    const items: SessionId[] = [];

    for (const sessionId of this._sessionIds) {
      items.push(sessionId);
    }

    return items;
  }
}

class BarrierWorld<K extends string, T> {
  private readonly _generator: () => T;
  private readonly _barriers = new Map<K, Barrier<T>>();

  constructor(generator: () => T) {
    this._generator = generator;
  }

  barrier(
    key: K,
    count: number,
    timeoutSec: TimeoutSec,
    sessionId: SessionId
  ): Promise<Barrier<T>> {
    const existing = this._barriers.get(key);
    let sync: Barrier<T>;

    if (existing !== undefined) {
      sync = existing;
    } else {
      sync = new Barrier<T>(count, timeoutSec, this._generator());
      this._barriers.set(key, sync);

      // Automatically unregister this sync group when it resolves
      sync.promise.then(() => this._barriers.delete(key));
    }

    sync.join(sessionId);

    return sync.promise;
  }

  cancel(sessionId: SessionId) {
    this._barriers.forEach(sync => sync.leave(sessionId));
  }
}

export class BarrierWorlds {
  private _match: BarrierWorld<MatchKey, MatchId>;
  private _sync: BarrierWorld<SyncKey, undefined>;
  private _nextMatchId: number;

  constructor() {
    this._match = new BarrierWorld(() => this._nextMatchId++ as MatchId);
    this._sync = new BarrierWorld(() => undefined);
    this._nextMatchId = 300;
  }

  match(
    key: MatchKey,
    count: number,
    timeoutSec: TimeoutSec,
    sessionId: SessionId
  ): Promise<Barrier<MatchId>> {
    return this._match.barrier(key, count, timeoutSec, sessionId);
  }

  sync(
    key: SyncKey,
    count: number,
    timeoutSec: TimeoutSec,
    sessionId: SessionId
  ): Promise<Barrier<undefined>> {
    return this._sync.barrier(key, count, timeoutSec, sessionId);
  }

  cancel(sessionId: SessionId) {
    this._match.cancel(sessionId);
    this._sync.cancel(sessionId);
  }
}
