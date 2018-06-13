const _ = require("lodash");

const config = require("./config");
const { parseMetricFromString } = require("./parsers");

const stats = { metricsProcessed: 0, metricErrors: 0 };
const state = { lastFlushTime: 0, totalMetrics: 0 };
const startTime = new Date();

const getStats = () => ({
  ...stats,
  ...state,
  upTimeSeconds: Math.floor((new Date() - startTime) / 1000),
});

const addMetricsProcessed = processed => {
  stats.metricsProcessed += processed;
  state.totalMetrics += processed;
};

const addMetricErrors = errors => (stats.metricErrors += errors.length);

const flushAggregates = sock => {
  const now = Math.floor(new Date().getTime() / 1000);

  const metrics = Object.keys(stats)
    .map(k => ({
      name: `md.srv.${k}`,
      value: stats[k],
      timestamp: now,
    }))
    .filter(s => s.value > 0);

  if (metrics.length == 0) return;

  Object.keys(stats).forEach(k => (stats[k] = 0));
  state.lastFlushTime = now;

  sock.send(JSON.stringify({ metrics }));
  sock.send(JSON.stringify({ flushAggregates: true }));
};

const processMetrics = (metrics, sock) => {
  if (!metrics) return false;

  const parsedMetrics = metrics
    .split(/(?:\r\n)|\|/)
    .filter(m => m)
    .map(parseMetricFromString);

  addMetricErrors(parsedMetrics.filter(m => !m.isValid));

  const validMetrics = parsedMetrics.filter(m => m.isValid).map(m => m.metric);

  if (validMetrics.length < 1) {
    return false;
  }

  addMetricsProcessed(validMetrics.length);

  const metricGroups = _.chunk(validMetrics, config.batchSize);
  metricGroups.forEach(g => sock.send(JSON.stringify({ metrics: g })));

  return true;
};

module.exports = {
  processMetrics,
  getStats,
  flushAggregates,
};
