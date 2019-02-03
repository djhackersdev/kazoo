import { Transform, TransformOptions } from "stream";

import * as Model from "./model";

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
  groupId: Model.GroupId;
  memberId: Model.MemberId;
  json: Model.GroupAttrs | null;
}

export interface StsOpenNotification {
  type: "STS_OPEN";
  status: Status;
  groupId: Model.GroupId;
  json: Model.GroupStatus | null;
}

export type Notification =
  | HelloNotification
  | PongNotification
  | ClientlogNotification
  | GroupCreateNotification
  | StsOpenNotification;

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
          `${n.type} ${n.status} ${n.groupId} ${n.memberId} ${JSON.stringify(
            n.json,
          )}`,
        );

      default:
        return callback(new TypeError("Unknown notification type"));
    }
  }
}
