const http = require("http");
const net = require("net");
const zmq = require("zeromq");
const config = require("./config");
const {
  processMetrics,
  getStats,
  flushAggregates,
} = require("./metricProcessingServer");

const port = config.serverPort;
const sock = zmq.socket("push");

const METRIC_URL = "/metrics";
const STAT_URL = "/stats";

const processMetricsFromBuffer = buffer => {
  const metrics = buffer.toString();
  const validMetrics = processMetrics(metrics, sock);
  return validMetrics;
};

const handlePostedData = (req, res) => {
  let body = [];
  req
    .on("data", chunk => {
      body.push(Buffer.from(chunk));
    })
    .on("end", () => {
      const validMetrics = processMetricsFromBuffer(Buffer.concat(body));

      if (validMetrics) {
        res.statusCode = 200;
        res.end("Received");
      } else {
        res.statusCode = 400;
        res.end("No valid metrics found");
      }
    });
};

const handleStatRequest = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(JSON.stringify(getStats()));
};

const requestHandler = (req, res) => {
  if (req.method === "POST" || req.method == "PUT") {
    if (req.url != METRIC_URL) {
      res.statusCode = 404;
      res.end("Unknown location");
      return;
    }

    handlePostedData(req, res);
    return;
  }

  if (req.method === "GET") {
    if (req.url !== STAT_URL) {
      res.statusCode = 404;
      res.end("Unknown location");
      return;
    }
    handleStatRequest(req, res);
    return;
  }

  res.end("Unknown request by: " + req.headers["user-agent"]);
};

const server = http.createServer(requestHandler);

const socketServer = net.createServer(c => {
  console.log("Client connected", c.remoteAddress);
  c.on("end", () => console.log("Client disconnected", c.remoteAddress));
  c.on("data", processMetricsFromBuffer);
});

const onSocketServerConnected = () =>
  console.log("Socket server listening on port", config.socketServerPort);

socketServer.on("error", e => {
  if (e.code === "EADDRINUSE") {
    console.log("Address in use, retrying...");
    setTimeout(() => {
      server.close();
      server.listen(config.socketServerPort, onSocketServerConnected);
    }, 1000);
  } else {
    console.error("Unknown error when connecting socket server", e);
  }
});

sock.bindSync(`tcp://${config.producerHost}:${config.producerSocket}`);

server.listen(port, err => {
  if (err) {
    return console.error("Unable to start metric server", err);
  }

  console.log(`server is listening on ${port}`);
});

socketServer.listen(config.socketServerPort, onSocketServerConnected);

setInterval(() => {
  flushAggregates(sock);
}, 60000);
