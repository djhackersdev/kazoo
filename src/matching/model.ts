// Quasi-nominative typing.
// The __brand property never actually exists at run time, we just pretend that
// it does for the sake of type checking.

type Brand<T, B> = T & { __brand: B };

export type FactionCode = Brand<0 | 1, "FactionCode">;
export type JoinType = "auto_join" | "create_always" | "create_nothing";

export type SessionId = Brand<number, "SessionId">;
export type GroupId = Brand<number, "GroupId">;
export type GroupKey = Brand<string, "GroupKey">;
export type StatusKey = Brand<string, "StatusKey">;
export type TopicKey = Brand<string, "TopicKey">;

export interface GroupCreateJson {
  max: number[];
  attr: any;
  // filter: any;
}

export interface GroupJson {
  max: number[];
  attr: any;
  member: SessionId[][];
}

export interface StatusData {
  [key: string]: Buffer;
}
