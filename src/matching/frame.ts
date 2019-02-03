import { Transform, TransformOptions } from "stream";

import { Logger } from "./logger";

interface Options extends TransformOptions {
  logger: Logger;
}

export class Deframer extends Transform {
  private _logger: Logger;
  private _state: string;

  constructor(options: Options) {
    super({
      encoding: "ascii",
      readableObjectMode: true,
      writableObjectMode: true,
      ...options,
    });

    this._logger = options.logger;
    this._state = "";
  }

  _transform(chunk, encoding, callback) {
    this._state += chunk;

    const pos = this._state.indexOf("\r\n");

    if (pos < 0) {
      return;
    }

    const line = this._state.substring(0, pos);

    this._state = this._state.substring(pos + 2, this._state.length);
    this._logger.log(`Deframe: ${line}`);

    return callback(null, line);
  }
}

export class Framer extends Transform {
  private logger: Logger;

  constructor(options: Options) {
    super({
      encoding: "ascii",
      writableObjectMode: true,
      ...options,
    });

    this.logger = options.logger;
  }

  _transform(chunk, encoding, callback) {
    this.logger.log(`Frame: ${chunk}`);

    return callback(null, chunk + "\r\n");
  }
}
