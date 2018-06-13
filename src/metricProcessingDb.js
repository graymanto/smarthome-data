const _ = require("lodash");

const { writeIndexedMetrics, writeGeneralMetrics } = require("./database");
const { parseCommonMetricFields, parseIndexedMetric } = require("./parsers");
const { getMetricGroup, metricGroupNames } = require("./metricAnalysers");

const metricProcessingState = {
  invalidGeneralMetrics: 0,
  invalidIndexedMetrics: 0,
  metricProcessingErrors: 0,
};

const addInvalidMetrics = metrics =>
  (metricProcessingState.invalidGeneralMetrics += metrics.length);

const addInvalidIndexedMetrics = metrics =>
  (metricProcessingState.invalidIndexedMetrics += metrics.length);

const addMetricProcessingError = () =>
  metricProcessingState.metricProcessingErrors++;

/**
 * Flushes the daemon internal state to the metrics tables
 */
const flushAggregates = db => {
  const now = Math.floor(new Date().getTime() / 1000);

  const metrics = Object.keys(metricProcessingState)
    .map(k => ({
      name: `md.db.${k}`,
      value: metricProcessingState[k],
      timestamp: now,
    }))
    .filter(s => s.value > 0);

  if (metrics.length == 0) return;

  Object.keys(metricProcessingState).forEach(
    k => (metricProcessingState[k] = 0)
  );

  metricProcessers[metricGroupNames.GENERAL](metrics, db);
};

/**
 * Takes a list of indexed metrics, parses them to ensure they
 * are correctly formatted then writes the metrics.
 * @param {array} metrics - The raw metrics to be processed.
 * @param {array} writer - The functions to write the metrics.
 */
const parseAndWriteIndexedMetrics = (metrics, parser, writer, onInvalid) => {
  const cbMetrics = metrics.map(parser);

  const gbValidated = _.groupBy(
    cbMetrics,
    m => (m.isValid ? "valid" : "invalid")
  );

  if (gbValidated["invalid"] && gbValidated["invalid"].length > 0) {
    onInvalid(gbValidated["invalid"]);
  }

  const toWrite = gbValidated["valid"];
  if (toWrite && toWrite.length > 0) {
    writer(toWrite);
  }
};

const metricProcessers = {
  [metricGroupNames.INVALID]: addInvalidMetrics,
  [metricGroupNames.INDEXED]: (metrics, db) =>
    parseAndWriteIndexedMetrics(
      metrics,
      parseIndexedMetric,
      cbMetrics => writeIndexedMetrics(db, cbMetrics),
      addInvalidIndexedMetrics
    ),
  [metricGroupNames.GENERAL]: (metrics, db) => writeGeneralMetrics(db, metrics),
};

/**
 * Takes a list of of raw metrics, performs and necessary parsing and dispatchs
 * the metric to a handler function depending on the metric type.
 * @param {object} db - The database connection handle.
 * @param {array} metrics - The raw metrics to be processed.
 * @param {array} processers - The handler functions for each metric type.
 */
const processMetrics = (
  db,
  metrics,
  parser = parseCommonMetricFields,
  processers = metricProcessers
) => {
  const parsedInitial = metrics.map(parser);
  const metricGroups = _.groupBy(parsedInitial, getMetricGroup);

  Object.keys(metricGroups).forEach(k => {
    if (k in processers) {
      const metrics = metricGroups[k];
      processers[k](metrics, db);
    } else {
      console.error("Unexpected metric type found.", k);
    }
  });
};

module.exports = {
  parseAndWriteIndexedMetrics,
  processMetrics,
  flushAggregates,
  addMetricProcessingError,
};
