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

    while (true) {
      const lf = this._state.indexOf("\n");

      if (lf < 0) {
        break;
      }

      // Deal with both LF (for hand-debugging) and CRLF (for real client)

      const end = lf > 0 && this._state[lf - 1] == "\r" ? lf - 1 : lf;
      const line = this._state.substring(0, end);

      this._state = this._state.substring(lf + 1, this._state.length);
      this._logger.log(`Deframe: ${line}`);

      this.push(line);
    }

    callback(null);
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
    this.push(chunk + "\r\n");

    callback(null);
  }
}
