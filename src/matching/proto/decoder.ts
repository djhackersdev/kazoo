import { Transform, TransformOptions } from "stream";

import { pegasus } from "../../../generated/pegasus";
import { Logger } from "../logger";

interface Options extends TransformOptions {
  logger: Logger;
}

export class Decoder extends Transform {
  private readonly _logger: Logger;

  constructor(options: Options) {
    super({
      ...options,
      readableObjectMode: true,
      writableObjectMode: true,
    });
    this._logger = options.logger;
  }

  _transform(chunk: Buffer, encoding, callback) {
    try {
      const cmd = pegasus.Command_Client.decode(chunk);

      this._logger.log(
        "Decoder:\n",
        JSON.stringify(cmd.toJSON(), undefined, 2),
        "\n"
      );

      return callback(null, cmd);
    } catch (e) {
      return callback(e);
    }
  }
}
