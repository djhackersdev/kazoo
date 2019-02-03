import { Socket } from "net";
import { pipeline } from "stream";

import { Command, Decoder } from "./decoder";
import { Encoder, Notification } from "./encoder";
import { Deframer, Framer } from "./frame";
import { Logger } from "./logger";

// Stock node.js stream stdlib typings are almost completely fucking useless
// why yes i would like to read/write a stream of `any`

interface Input {
  [Symbol.asyncIterator]: () => AsyncIterableIterator<Command>;
}

interface Output {
  write(n: Notification): void;
}

export function setup(socket: Socket) {
  if (!socket.remoteAddress) {
    throw new ReferenceError();
  }

  const logger = new Logger(socket.remoteAddress);

  const input = pipeline(socket, new Deframer({ logger }), new Decoder());
  const output = new Encoder();

  pipeline(output, new Framer({ logger }), socket);

  return {
    logger,
    input: input as Input,
    output: output as Output,
  };
}
