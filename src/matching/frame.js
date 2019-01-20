const { Transform } = require("stream");

class Deframer extends Transform {
  constructor(options) {
    super({
      encoding: "ascii",
      readableObjectMode: true,
      writableObjectMode: true,
      ...options,
    });

    this.state = "";
  }

  _transform(chunk, encoding, callback) {
    this.state += chunk;

    const pos = this.state.indexOf("\r\n");

    if (pos < 0) {
      return;
    }

    const line = this.state.substring(0, pos);

    this.state = this.state.substring(pos + 2, this.state.length);
    console.log(`Matching: Deframe: ${line}`);

    return callback(null, line);
  }
}

class Framer extends Transform {
  constructor(options) {
    super({
      encoding: "ascii",
      writableObjectMode: true,
      ...options,
    });
  }

  _transform(chunk, encoding, callback) {
    console.log(`Matching: Frame: ${chunk}`);

    return callback(null, chunk + "\r\n");
  }
}

module.exports = {
  Deframer,
  Framer,
};
