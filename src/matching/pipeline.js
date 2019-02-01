const { pipeline } = require("stream");

const { Deframer, Framer } = require("./frame");
const { Logger } = require("./logger");
const { Decoder, Encoder } = require("./msg");

function setup(socket) {
  const logger = new Logger(socket.remoteAddress);

  const input = pipeline(
    socket,
    new Deframer({ logger }),
    new Decoder({ logger }),
  );

  const output = new Encoder();

  pipeline(output, new Framer({ logger }), socket);

  return { logger, input, output };
}

module.exports = setup;
