const { pipeline } = require("stream");

const { Decoder } = require("./cmd");
const { Deframer, Framer } = require("./frame");
const { Logger } = require("./logger");

function setup(socket) {
  const logger = new Logger(socket.remoteAddress);

  const input = pipeline(
    socket,
    new Deframer({ logger }),
    new Decoder({ logger }),
  );

  const output = new Framer({ logger });

  pipeline(output, socket);

  return { logger, input, output };
}

module.exports = setup;
