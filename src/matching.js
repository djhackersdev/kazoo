function dispatch(socket) {
  console.log("Connected, waiting for hello");
  delete socket._readableState.decoder;

  let input = "";

  socket.on("data", startup);

  function startup(msg) {
    input += msg.toString("ascii");

    if (msg.indexOf("}") === -1) {
      return;
    }

    console.log("<<< ", input);

    const now = new Date();

    const json = JSON.stringify({
      time: now.toISOString(),
      majorVer: 57,
      minorVer: 7,
      localVer: 35707,
      sessionId: 1234,
    });

    const output = `HELLO OK ${json}\r\n`;

    console.log(">>> ", output);

    socket.write(output);
    socket.off("data", startup);
    socket.on("data", function(asdf) {
      console.log("data lol", asdf);
    });
  }

  // ..?
}

module.exports = dispatch;
