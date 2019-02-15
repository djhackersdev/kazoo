import { Transform, TransformOptions } from "stream";

import { Logger } from "../logger";

interface Options extends TransformOptions {
  logger: Logger;
}

export class Framer extends Transform {
  private _logger: Logger;

  constructor(options: Options) {
    super({
      writableObjectMode: true,
      ...options,
    });

    this._logger = options.logger;
  }

  _transform(msg: Buffer, encoding, callback) {
    const len = Buffer.alloc(4);

    len.writeUInt32BE(msg.length, 0);

    const frame = Buffer.concat([len, msg]);

    this.push(frame);

    return callback(null);
  }
}
