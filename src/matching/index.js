const setup = require("./pipeline");

const groups = {};
let nextGroupId = 100;

function createGroup(msg) {
  const { json, key } = msg;
  const { max, attr } = json;

  const id = nextGroupId++;
  const group = {
    max,
    attr: {
      ...attr,
      member: [[], []],
    },
  };

  groups[id] = group;

  return {
    status: "OK",
    key,
    id,
    json: group,
  };
}

async function matching(socket) {
  const { logger, input, output } = setup(socket);

  logger.log("Connection opened");

  try {
    for await (const msg of input) {
      const { type } = msg;

      switch (type) {
        case "HELLO":
          const now = new Date();

          output.write({
            type,
            status: "OK",
            json: {
              time: now.toISOString(),
              majorVer: 57,
              minorVer: 7,
              localVer: 35707,
              sessionId: 1234,
            },
          });

          break;

        case "PING":
          output.write({ type: "PONG" });

          break;

        case "CLIENTLOG":
          output.write({ type, status: "OK" });

          break;

        case "GROUP_CREATE":
          output.write({ type, ...createGroup(msg) });

          break;

        default:
          logger.log("Received unknown command");
      }
    }
  } catch (e) {
    logger.log(e);
  }

  logger.log("Connection closed");
}

module.exports = matching;
