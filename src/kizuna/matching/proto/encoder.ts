import { Transform, TransformOptions } from "stream";

import { pegasus } from "../../../../generated/pegasus";
import { Logger } from "../logger";
import { BufferWriter } from "protobufjs";

interface Options extends TransformOptions {
  logger: Logger;
}

export class Encoder extends Transform {
  private readonly _logger: Logger;

  constructor(options: Options) {
    super({
      ...options,
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this._logger = options.logger;
  }

  _transform(notification: pegasus.Command_Server, encoding, callback): void {
    this._logger.log(
      "Encoder:\n",
      JSON.stringify(notification.toJSON(), undefined, 4),
      "\n"
    );

    let writer: BufferWriter;

    try {
      writer = pegasus.Command_Server.encode(notification);
    } catch (e) {
      return callback(e);
    }

    return callback(null, writer.finish());
  }
}
