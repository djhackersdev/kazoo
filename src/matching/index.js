const setup = require("./pipeline");

async function matching(socket) {
  const { logger, input, output } = setup(socket);

  logger.log("Connection opened");

  for await (const req of input) {
    const { cmd } = req;

    switch (cmd) {
      case "HELLO":
        const now = new Date();
        const json = JSON.stringify({
          time: now.toISOString(),
          majorVer: 57,
          minorVer: 7,
          localVer: 35707,
          sessionId: 1234,
        });

        output.write(`HELLO OK ${json}`);

        break;

      case "PING":
        output.write("PONG");

        break;

      default:
        logger.log("Received unknown command");
    }
  }

  logger.log("Connection closed");
}

module.exports = matching;
