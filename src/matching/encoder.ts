import { Transform, TransformOptions } from "stream";

import * as Msg from "./msg";

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
    attr: Msg.GroupAttrs;
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
