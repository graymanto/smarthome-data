const serverPort = process.env.SHDC_HTTP_PORT || 8989;
const socketServerPort = process.env.SHDC_SSERVER_PORT || 2003;
const producerSocket = process.env.SHDC_WORKER_SOCKET || 9024;
const producerHost = process.env.SHDC_WORKER_SOCKET || "127.0.0.1";
const dbUser = process.env.SHDC_DBUSER || "smarthome_daemon";
const dbPassword = process.env.SHDC_DBPASSWORD || "G9ZZkEVR8TlshE";
const dbHostname = process.env.SHDC_DBHOST || "localhost";
const dbPort = process.env.SHDC_DBPORT || 5432;
const dbDatabase = process.env.SHDC_DATABASENAME || "smarthome_data";
const batchSize = process.env.SHDC_BATCHSIZE || 500;

const connectionString =
  process.env.SHDC_CONNECTIONSTRING ||
  `postgres://${dbUser}:${dbPassword}@${dbHostname}:${dbPort}/${dbDatabase}`;

module.exports = {
  serverPort,
  socketServerPort,
  producerSocket,
  producerHost,
  connectionString,
  batchSize,
};
