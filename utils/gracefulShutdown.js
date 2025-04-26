const { customLog } = require("./CustomLog");

function gracefulShutdown(socket) {
  let socketClosed = false;

  const shutdown = (signal) => {
    customLog(`Received ${signal}. Cleaning up...`);

    if (!socketClosed) {
      socket.close(() => {
        customLog("UDP socket closed.");
        process.exit(0);
      });
      socketClosed = true;
    } else {
      customLog("Socket was already closed.");
      process.exit(0);
    }
  };

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });

  socket.on("close", () => {
    socketClosed = true;
  });
}

module.exports = {
  gracefulShutdown,
};
