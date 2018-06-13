const indexedMetrics = { templevel: 1 };

const metricGroupNames = {
  INVALID: "invalid",
  INDEXED: "indexed",
  GENERAL: "general",
};

const getIndexedMetricFieldCount = name => indexedMetrics[name] || 0;

const getMetricGroup = metric => {
  if (
    !metric.isValid ||
    !metric.nameSections ||
    metric.nameSections.length < 1
  ) {
    return metricGroupNames.INVALID;
  }

  if (indexedMetrics[metric.nameSections[0]]) {
    return metricGroupNames.INDEXED;
  }

  return metricGroupNames.GENERAL;
};

module.exports = {
  getMetricGroup,
  metricGroupNames,
  getIndexedMetricFieldCount,
};
