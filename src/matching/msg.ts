import { Transform, TransformOptions } from "stream";

import { split } from "./split";

type FactionCode = 0 | 1;
type JoinType = "auto_join" | "create_always" | "create_nothing";

export interface GroupAttrs {
  time?: string;
  visible?: 1 | 0;
  member?: number[][];
}

export interface HelloCommand {
  type: "HELLO";
  version: string;
  json: {
    shopId: number;
    clientVer: string;
    productId: string;
    serial: string;
  };
}

export interface PingCommand {
  type: "PING";
}

export interface ClientLogCommand {
  type: "CLIENTLOG";
  json: any;
}

export interface GroupCreateCommand {
  type: "GROUP_CREATE";
  groupId: string;
  faction: FactionCode;
  joinType: JoinType;
  json: {
    max: number[];
    attr: GroupAttrs;
  };
}

export interface StsOpenCommand {
  type: "STS_OPEN";
  groupId: string;
  data: Buffer;
}

export type Command =
  | HelloCommand
  | PingCommand
  | ClientLogCommand
  | GroupCreateCommand
  | StsOpenCommand;

type DecoderCallback = ((e: Error) => void) & ((e: null, c: Command) => void);

export class Decoder extends Transform {
  constructor(options?: TransformOptions) {
    super({
      ...options,
      readableObjectMode: true,
      writableObjectMode: true,
    });
  }

  _transform(line: string, encoding: string, callback: DecoderCallback): void {
    const space = line.indexOf(" ");
    const type = space >= 0 ? line.substring(0, space) : line;
    let tokens;

    switch (type) {
      case "HELLO":
        tokens = split(line, 3);

        return callback(null, {
          type,
          version: tokens[1],
          json: JSON.parse(tokens[2]),
        });

      case "PING":
        return callback(null, { type });

      case "CLIENTLOG":
        tokens = split(line, 2);

        return callback(null, {
          type,
          json: JSON.parse(tokens[1]),
        });

      case "GROUP_CREATE":
        tokens = split(line, 5);

        return callback(null, {
          type,
          groupId: tokens[1],
          faction: parseInt(tokens[2], 10) as FactionCode,
          joinType: tokens[3] as JoinType,
          json: JSON.parse(tokens[4]),
        });

      case "STS_OPEN":
        tokens = split(line, 3);

        return callback(null, {
          type,
          groupId: tokens[1],
          data: Buffer.from(tokens[2], "base64"),
        });
      default:
        return callback(new Error(`Unknown command "${type}"`));
    }
  }
}

type Status = "OK" | "NG";

export interface HelloNotification {
  type: "HELLO";
  status: Status;
  json: {
    time: string;
    majorVer: number;
    minorVer: number;
    localVer: number;
    sessionId: number;
  };
}

export interface PongNotification {
  type: "PONG";
}

export interface ClientlogNotification {
  type: "CLIENTLOG";
  status: Status;
}

export interface GroupCreateNotification {
  type: "GROUP_CREATE";
  status: Status;
  groupId: string;
  partId: number;
  json: {
    max: number[];
    attr: GroupAttrs;
    member: number[][];
  };
}

export type Notification =
  | HelloNotification
  | PongNotification
  | ClientlogNotification
  | GroupCreateNotification;

type EncoderCallback = ((e: Error) => void) & ((e: null, ln: string) => void);

export class Encoder extends Transform {
  constructor(options?: TransformOptions) {
    super({
      ...options,
      readableObjectMode: true,
      writableObjectMode: true,
    });
  }

  _transform(
    n: Notification,
    encoding: string,
    callback: EncoderCallback,
  ): void {
    switch (n.type) {
      case "HELLO":
        return callback(
          null,
          `${n.type} ${n.status} ${JSON.stringify(n.json)}`,
        );

      case "PONG":
        return callback(null, n.type);

      case "CLIENTLOG":
        return callback(null, `${n.type} ${n.status}`);

      case "GROUP_CREATE":
        return callback(
          null,
          `${n.type} ${n.status} ${n.groupId} ${n.partId} ${JSON.stringify(
            n.json,
          )}`,
        );

      default:
        return callback(new TypeError("Unknown notification type"));
    }
  }
}
