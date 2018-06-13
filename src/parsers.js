const _ = require("lodash");
const { getIndexedMetricFieldCount } = require("./metricAnalysers");

/**
 * Parses a metric to check fields common to all metrics
 * Validates if data in fields is correct and if so returns a new metric
 * object with the parsed fields.
 * @param {object} metric - The metric to be parsed.
 */
const parseCommonMetricFields = metric => {
  if (!metric || !metric.name || !metric.value || !metric.timestamp) {
    console.error("invalid message received in db writer");
    return { isValid: false };
  }

  const nameSections = metric.name.split(".");
  if (nameSections.length < 1) {
    console.error("invalid metric name received in db writer", metric.name);
    return { isValid: false };
  }

  return { isValid: true, ...metric, nameSections };
};

/**
 * Parses an indexed metric. Validates if data in fields is correct and
 * returns a new metric object with the parsed fields.
 * @param {object} metric - The metric to be parsed.
 */
const parseIndexedMetric = metric => {
  const numIndexes = getIndexedMetricFieldCount(metric.nameSections[0]);

  if (numIndexes == 0 || metric.nameSections.length < numIndexes + 1) {
    console.error("invalid indexed metric received in db writer", metric.name);
    return { isValid: false };
  }

  const value = parseFloat(metric.value);
  const indexedVals = _.takeRight(metric.nameSections, numIndexes).map(m =>
    parseInt(m)
  );

  if ((!value && value != 0) || !indexedVals.every(v => v)) {
    return { isValid: false };
  }

  return {
    isValid: true,
    name: metric.nameSections[0],
    indexedVals,
    value,
    timestamp: metric.timestamp,
  };
};

/**
 * Parses the input string to see if the content is a valid metric.
 * @param {string} metric - The metric string to be parsed.
 */
const parseMetricFromString = metric => {
  if (!metric) {
    console.error("Attempting to parse missing string.");
    return { isValid: false };
  }

  const sections = metric.split(" ");

  if (sections.length !== 3) {
    console.error(
      "Invalid metric format found. Sections",
      metric,
      sections.length,
      sections
    );
    return { isValid: false };
  }

  if (!parseInt(sections[2])) {
    console.error(
      "Invalid metric format found. Timestamp field is not numeric",
      metric,
      sections[2]
    );
    return { isValid: false };
  }

  return {
    isValid: true,
    metric: {
      name: sections[0],
      value: sections[1],
      timestamp: sections[2],
    },
  };
};

module.exports = {
  parseCommonMetricFields,
  parseIndexedMetric,
  parseMetricFromString,
};
