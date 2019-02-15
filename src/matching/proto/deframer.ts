import { Transform, TransformOptions } from "stream";

import { Logger } from "../logger";

interface Options extends TransformOptions {
  logger: Logger;
}

export class Deframer extends Transform {
  private _logger: Logger;
  private _state: Buffer;

  constructor(options: Options) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
      ...options,
    });

    this._logger = options.logger;
    this._state = Buffer.alloc(0);
  }

  _transform(chunk: Buffer, encoding, callback) {
    this._state = Buffer.concat([this._state, chunk]);

    while (true) {
      if (this._state.length < 4) {
        break;
      }

      const nbytes = this._state.readUInt32BE(0);

      if (this._state.length < 4 + nbytes) {
        break;
      }

      const frame = this._state.slice(4, 4 + nbytes);

      this.push(frame);

      this._state = this._state.slice(4 + nbytes);
    }

    return callback(null);
  }
}
