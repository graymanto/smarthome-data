const { metricGroupNames } = require("../src/metricAnalysers");
jest.mock("../src/metricAnalysers");

const { getMetricGroup } = require("../src/metricAnalysers");

const {
  parseAndWriteIndexedMetrics,
  processMetrics,
} = require("../src/metricProcessingDb");

const parseAndWriteIndexedMetricsTests = [
  [
    {
      isValid: true,
      name: "test1",
      indexedVals: [1, 2],
      value: 12,
      timestamp: 123456,
    },
    {
      isValid: true,
      name: "test",
      indexedVals: [2, 1],
      value: 75.2,
      timestamp: 1237593,
    },
    { isValid: false },
    { isValid: false },
  ],
  [
    {
      isValid: true,
      name: "test1",
      indexedVals: [1, 2],
      value: 12,
      timestamp: 123456,
    },
  ],
  [
    {
      isValid: false,
    },
  ],
];

const processMetricsTests = [
  [
    {
      isValid: true,
      name: "battlevel.2.1",
      nameSections: ["battlevel"],
      value: 12,
      timestamp: 123456,
      expectedMetricGroup: metricGroupNames.INDEXED,
    },
    {
      isValid: true,
      name: "cabswaps.1.2",
      nameSections: ["cabswaps"],
      value: 75.2,
      timestamp: 1237593,
      expectedMetricGroup: metricGroupNames.INDEXED,
    },
    {
      isValid: false,
      expectedMetricGroup: metricGroupNames.INVALID,
    },
    {
      isValid: false,
      expectedMetricGroup: metricGroupNames.INVALID,
    },
  ],
  [
    {
      isValid: true,
      name: "test1",
      nameSections: ["generalmetric"],
      value: 12,
      timestamp: 123456,
      expectedMetricGroup: metricGroupNames.GENERAL,
    },
  ],
  [
    {
      isValid: false,
      expectedMetricGroup: metricGroupNames.INVALID,
    },
  ],
];

test("checks that parseAndWriteIndexedMetrics correctly parses and writes metrics", () => {
  const dummyMetric = { name: "test", value: 1, timestamp: 12345 };

  parseAndWriteIndexedMetricsTests.forEach(t => {
    const writer = jest.fn();
    const onInvalid = jest.fn();
    const parser = jest.fn();

    // Create an input metric array of correct size.
    const dummyInputs = Array(t.length).fill(dummyMetric);

    // Use test cases to mock return values of parser function
    t.forEach(tv => parser.mockReturnValueOnce(tv));

    parseAndWriteIndexedMetrics(dummyInputs, parser, writer, onInvalid);

    expect(parser.mock.calls.length).toBe(t.length);

    const expectedValids = t.filter(tv => tv.isValid);
    const expectedInvalids = t.filter(tv => !tv.isValid);

    if (expectedValids.length == 0) {
      expect(writer.mock.calls.length).toBe(0);
    } else {
      expect(writer.mock.calls.length).toBe(1);
      expect(writer.mock.calls[0][0]).toEqual(expectedValids);
    }

    if (expectedInvalids.length == 0) {
      expect(onInvalid.mock.calls.length).toBe(0);
    } else {
      expect(onInvalid.mock.calls.length).toBe(1);
      expect(onInvalid.mock.calls[0][0]).toEqual(expectedInvalids);
    }
  });
});

test("checks that processMetrics correctly dispatchs metric types", () => {
  const dummyMetric = { name: "test", value: 1, timestamp: 12345 };
  const db = {};

  processMetricsTests.forEach(t => {
    const parser = jest.fn();
    const indexedDispatcher = jest.fn();
    const generalDispatcher = jest.fn();
    const invalidDispatcher = jest.fn();

    getMetricGroup.mockReset();

    const dispatchers = {
      [metricGroupNames.INDEXED]: indexedDispatcher,
      [metricGroupNames.GENERAL]: generalDispatcher,
      [metricGroupNames.INVALID]: invalidDispatcher,
    };

    const dummyInputs = Array(t.length).fill(dummyMetric);

    t.forEach(tv => parser.mockReturnValueOnce(tv));
    t.forEach(tv => getMetricGroup.mockReturnValueOnce(tv.expectedMetricGroup));

    // Invoke the function to be tested
    processMetrics(db, dummyInputs, parser, dispatchers);

    // Each metric should have been parsed.
    expect(getMetricGroup.mock.calls.length).toBe(t.length);

    // Find how many of each type of metric we have in the test cases
    const indexedEntries = t.filter(
      tv => tv.expectedMetricGroup == metricGroupNames.INDEXED
    );
    const numIndexed = indexedEntries.length;

    const generalEntries = t.filter(
      tv => tv.expectedMetricGroup == metricGroupNames.GENERAL
    );
    const numGeneral = generalEntries.length;

    const invalidEntries = t.filter(
      tv => tv.expectedMetricGroup == metricGroupNames.INVALID
    );
    const numInvalid = invalidEntries.length;

    // Assert that the dispatchers were called depending on if each type of metric
    // exists in the test cases
    expect(indexedDispatcher.mock.calls.length > 0).toBe(
      numIndexed > 0 ? true : false
    );
    expect(generalDispatcher.mock.calls.length > 0).toBe(
      numGeneral > 0 ? true : false
    );
    expect(invalidDispatcher.mock.calls.length > 0).toBe(
      numInvalid > 0 ? true : false
    );

    // Check that the parameters to the dispatchers were correct
    if (indexedEntries > 0) {
      expect(indexedDispatcher.mock.calls).toEqual([indexedEntries, db]);
    }
    if (generalEntries > 0) {
      expect(generalDispatcher.mock.calls).toEqual([generalEntries, db]);
    }
    if (invalidEntries > 0) {
      expect(invalidDispatcher.mock.calls).toEqual([invalidEntries, db]);
    }
  });
});
