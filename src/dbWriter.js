const zmq = require("zeromq");

const config = require("./config");
const { connectDb } = require("./database");

const {
  processMetrics,
  flushAggregates,
  addMetricProcessingError,
} = require("./metricProcessingDb");

/**
 * Tries to connect to the input socket on which metrics will be received.
 */
const connectToSocket = db => {
  const sock = zmq.socket("pull");

  sock.connect(`tcp://${config.producerHost}:${config.producerSocket}`);
  console.log("Worker connected to port 9024");

  sock.on("message", msg => {
    try {
      const message = JSON.parse(msg.toString());

      if (message.flushAggregates) {
        flushAggregates(db);
        return;
      }

      if (!message.metrics) {
        console.error("Invalid metrics message passed to dbwriter");
        return;
      }

      processMetrics(db, message.metrics);
    } catch (err) {
      console.error("Error processing incoming message", err, msg.toString());
      addMetricProcessingError();
    }
  });

  return sock;
};

/**
 * Starts a loop that tries to connect to the database every 2 seconds.
 */
const startConnectionLoop = () => {
  connectDb().then(status => {
    if (status.connected) {
      console.error("Database is connected");
      const sock = connectToSocket(status.db);

      // If database pool disconnects, close socket and try to reconnect.
      status.pool.on("error", e => {
        console.error("Database connection error", e);
        sock.close();
        startConnectionLoop();
      });
      return;
    }
    setTimeout(startConnectionLoop, 2000);
  });
};

startConnectionLoop();
