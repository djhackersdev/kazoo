const { Transform } = require("stream");

const { split } = require("./split");

const decoders = {
  HELLO: line => {
    const tokens = split(line, 3);

    return {
      version: tokens[1],
      json: JSON.parse(tokens[2]),
    };
  },

  PING: line => ({}),

  CLIENTLOG: line => {
    const tokens = split(line, 2);

    return {
      json: JSON.parse(tokens[1]),
    };
  },

  GROUP_CREATE: line => {
    const tokens = split(line, 5);

    return {
      key: tokens[1],
      idk: parseInt(tokens[2], 10),
      joinType: tokens[3],
      json: JSON.parse(tokens[4]),
    };
  },
};

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
    const type = space >= 0 ? line.substring(0, space) : line;
    const decoder = decoders[type];

    if (decoder !== undefined) {
      return callback(null, { type, ...decoder(line) });
    } else {
      return callback(new Error(`Unknown command "${type}"`));
    }
  }
}

const encoders = {
  HELLO: m => `${m.status} ${JSON.stringify(m.json)}`,
  PONG: m => "",
  CLIENTLOG: m => `${m.status}`,
  GROUP_CREATE: m => `${m.status} ${m.key} ${m.id} ${JSON.stringify(m.json)}`,
};

class Encoder extends Transform {
  constructor(options) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
      ...options,
    });
  }

  _transform(msg, encoding, callback) {
    const encoder = encoders[msg.type];

    if (encoder !== undefined) {
      const payload = encoder(msg);
      const line = payload !== "" ? `${msg.type} ${payload}` : msg.type;

      return callback(null, line);
    } else {
      return callback(
        new Error(`Don't know how to encode notification ${msg.type}`),
      );
    }
  }
}

module.exports = {
  Decoder,
  Encoder,
};
