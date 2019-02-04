import { Transform, TransformOptions } from "stream";

import { split } from "./split";
import * as Model from "../model";

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
  groupId: Model.GroupId;
  faction: Model.FactionCode;
  joinType: Model.JoinType;
  json: Model.GroupCreateJson;
}

export interface StsOpenCommand {
  type: "STS_OPEN";
  statusId: Model.StatusId;
  datum: Buffer;
}

export interface SubscribeCommand {
  type: "SUBSCRIBE";
  topicId: Model.TopicId;
  unknown: number;
}

export interface GroupSearchCommand {
  type: "GROUP_SEARCH";
  groupId: Model.GroupId;
  unknown: number;
  filter: any;
}

export interface PublishCommand {
  type: "PUBLISH";
  topicId: Model.TopicId;
  datum: Buffer;
}

export type Command =
  | HelloCommand
  | PingCommand
  | ClientLogCommand
  | GroupCreateCommand
  | StsOpenCommand
  | SubscribeCommand
  | GroupSearchCommand
  | PublishCommand;

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
    let tokens: string[];

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
          groupId: tokens[1] as Model.GroupId,
          faction: parseInt(tokens[2], 10) as Model.FactionCode,
          joinType: tokens[3] as Model.JoinType,
          json: JSON.parse(tokens[4]),
        });

      case "STS_OPEN":
        tokens = split(line, 3);

        return callback(null, {
          type,
          statusId: tokens[1] as Model.StatusId,
          datum: Buffer.from(tokens[2], "base64"),
        });

      case "SUBSCRIBE":
        tokens = split(line, 3);

        return callback(null, {
          type,
          topicId: tokens[1] as Model.TopicId,
          unknown: parseInt(tokens[2], 10),
        });

      case "GROUP_SEARCH":
        tokens = split(line, 4);

        return callback(null, {
          type,
          groupId: tokens[1] as Model.GroupId,
          unknown: parseInt(tokens[2], 10),
          filter: JSON.parse(tokens[3]),
        });

      case "PUBLISH":
        tokens = split(line, 3);

        return callback(null, {
          type,
          topicId: tokens[1] as Model.TopicId,
          datum: Buffer.from(tokens[2], "base64"),
        });

      default:
        return callback(new Error(`Unknown command "${type}"`));
    }
  }
}
