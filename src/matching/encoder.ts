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
  json: Model.GroupJson | null;
}

export interface StsOpenNotification {
  type: "STS_OPEN";
  status: Status;
  groupId: Model.GroupId;
  groupStatus: Model.GroupStatus | null;
}

export interface SubscribeNotification {
  type: "SUBSCRIBE";
  topicId: Model.TopicId;
  status: Status;
}

export interface GroupUpdateNotification {
  type: "GROUP_UPDATE_NOTIFY";
  groupId: Model.GroupId;
  memberId: Model.MemberId;
  json: Model.GroupJson;
}

export interface StatusNotification {
  type: "STS_NOTIFY";
  groupId: Model.GroupId;
  memberId: Model.MemberId;
  data: Buffer;
}

export interface GroupSearchNotification {
  type: "GROUP_SEARCH";
  status: Status;
  groupId: Model.GroupId;
  json: {
    [key: string]: Model.GroupJson;
  };
}

export type Notification =
  | HelloNotification
  | PongNotification
  | ClientlogNotification
  | GroupCreateNotification
  | StsOpenNotification
  | SubscribeNotification
  | GroupUpdateNotification
  | StatusNotification
  | GroupSearchNotification;

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

      case "STS_OPEN":
        return callback(
          null,
          `${n.type} ${n.status} ${n.groupId} ${Encoder._encodeStatuses(
            n.groupStatus,
          )}`,
        );

      case "SUBSCRIBE":
        return callback(
          null,
          `${n.type} ${n.status} null`, // TODO figure JSON payload
        );

      case "GROUP_UPDATE_NOTIFY":
        return callback(
          null,
          `${n.type} ${n.groupId} ${n.memberId} ${JSON.stringify(n.json)}`,
        );

      case "STS_NOTIFY":
        return callback(
          null,
          `${n.type} ${n.groupId} ${n.memberId} ${n.data.toString("base64")}`,
        );

      case "GROUP_SEARCH":
        return callback(
          null,
          `${n.type} ${n.status} ${n.groupId} ${JSON.stringify(n.json)}`,
        );

      default:
        return callback(new TypeError("Unknown notification type"));
    }
  }

  static _encodeStatuses(statuses: Model.GroupStatus | null): string {
    if (statuses == null) {
      return "null";
    }

    const result = {};

    for (let k in statuses) {
      result[k] = statuses[k].toString("base64");
    }

    return JSON.stringify(result);
  }
}
