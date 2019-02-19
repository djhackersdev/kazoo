import { Socket } from "net";
import { pipeline } from "stream";

import { pegasus } from "../../../generated/pegasus";
import { Decoder } from "./decoder";
import { Deframer } from "./deframer";
import { Encoder } from "./encoder";
import { Framer } from "./framer";
import { Logger } from "../logger";

// Stock node.js stream stdlib typings are almost completely fucking useless
// why yes i would like to read/write a stream of `any`

export interface Input {
  [Symbol.asyncIterator]: () => AsyncIterableIterator<pegasus.Command_Client>;
}

export interface Output {
  write(n: pegasus.Command_Server): void;
}

function streamEnded(error?: Error) {
  // Node v11 now demands a callback param to pipeline()
}

export function setup(socket: Socket) {
  const logger = new Logger(socket.remoteAddress!);

  const input = pipeline(
    socket,
    new Deframer({ logger }),
    new Decoder({ logger }),
    streamEnded
  );

  const output = new Encoder({ logger });

  pipeline(output, new Framer({ logger }), socket, streamEnded);

  return {
    logger,
    input: input as Input,
    output: output as Output,
  };
}
