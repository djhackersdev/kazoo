const { Transform } = require("stream");

class Decoder extends Transform {
  constructor(options) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
      ...options,
    });
  }

  _transform(line, encoding, callback) {
    const space = line.indexOf(" ");
    const cmd = space >= 0 ? line.substring(0, space) : line;

    callback(null, { cmd, line });
  }
}

module.exports = {
  Decoder,
};
