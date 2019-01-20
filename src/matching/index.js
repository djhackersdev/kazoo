const setup = require("./pipeline");

async function matching(socket) {
  const { input, output } = setup(socket);

  console.log("Matching: Connection opened");

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
        console.log("Received unknown command");
    }
  }

  console.log("Matching: Connection closed");
}

module.exports = matching;
