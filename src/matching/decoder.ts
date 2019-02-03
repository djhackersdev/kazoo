import { Transform, TransformOptions } from "stream";

import * as Msg from "./msg";
import { split } from "./split";

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
  faction: Msg.FactionCode;
  joinType: Msg.JoinType;
  json: {
    max: number[];
    attr: Msg.GroupAttrs;
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
          faction: parseInt(tokens[2], 10) as Msg.FactionCode,
          joinType: tokens[3] as Msg.JoinType,
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
