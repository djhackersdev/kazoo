const { pipeline } = require("stream");

const { Decoder } = require("./cmd");
const { Deframer, Framer } = require("./frame");

function setup(socket) {
  const input = pipeline(socket, new Deframer(), new Decoder());
  const output = new Framer();

  pipeline(output, socket);

  return { input, output };
}

module.exports = setup;
