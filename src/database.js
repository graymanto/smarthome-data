const { Pool } = require("pg");
const { insert } = require("sql-bricks");
const config = require("./config");

const connectDb = () => {
  const pool = new Pool({ connectionString: config.connectionString });
  return pool
    .connect()
    .then(db => ({ connected: true, db, pool }))
    .catch(e => {
      console.error("Error connecting to database", e);
      return { connected: false };
    });
};

const writeIndexedMetrics = (db, metrics) => {
  const toDb = m => ({
    time: m.timestamp,
    name: m.name,
    index1: m.indexedVals[0],
    index2: m.indexedVals[1], // These indexes could be undefined.
    index3: m.indexedVals[2],
    value: m.value,
  });

  console.log("Writing metrics");

  const sql = insert("metric_table_indexed").values(metrics.map(toDb));
  const { text, values } = sql.toParams();

  // Add a timestamp cast to the first parameter in the sql.
  const firstParamRE = /\((\$\d+),/gi;
  const withCastText = text.replace(firstParamRE, "(to_timestamp($1),");

  db.query(withCastText, values).catch(e => console.error("Insert failed", e));
};

const writeGeneralMetrics = (db, metrics) => {
  const toDb = m => ({
    time: m.timestamp,
    name: m.name,
    value: m.value,
  });

  console.log("Writing general metrics");

  const sql = insert("metric_table_general").values(metrics.map(toDb));
  const { text, values } = sql.toParams();

  // Add a timestamp cast to the first parameter in the sql.
  const firstParamRE = /\((\$\d+),/gi;
  const withCastText = text.replace(firstParamRE, "(to_timestamp($1),");

  db.query(withCastText, values).catch(e => console.error("Insert failed", e));
};

module.exports = {
  connectDb,
  writeIndexedMetrics,
  writeGeneralMetrics,
};
