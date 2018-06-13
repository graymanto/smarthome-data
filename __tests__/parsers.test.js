const {
  parseCommonMetricFields,
  parseIndexedMetric,
  parseMetricFromString,
} = require("../src/parsers");

const missingFieldGeneralMetrics = [
  {
    value: 0,
    timestamp: 0,
  },
  {
    name: "name",
    value: 35,
  },
  {
    name: "name",
    timestamp: 12344566,
  },
  {
    name: "",
    value: 23,
    timestamp: 12344566,
  },
];

const validGeneralMetricTests = [
  [
    { name: "test1", value: 12, timestamp: 123456 },
    {
      isValid: true,
      name: "test1",
      value: 12,
      timestamp: 123456,
      nameSections: ["test1"],
    },
  ],
  [
    { name: "test.1.2", value: 15, timestamp: 123456 },
    {
      isValid: true,
      name: "test.1.2",
      value: 15,
      timestamp: 123456,
      nameSections: ["test", "1", "2"],
    },
  ],
];

const indexedMetricTests = [
  [
    {
      name: "battlevel.1.2",
      value: 12,
      timestamp: 123456,
      nameSections: ["battlevel", "1", "2"],
    },
    {
      isValid: true,
      name: "battlevel",
      indexedVals: [1, 2],
      value: 12,
      timestamp: 123456,
    },
  ],
  [
    {
      name: "battlevel.1.2",
      value: 0,
      timestamp: 123456,
      nameSections: ["battlevel", "1", "2"],
    },
    {
      isValid: true,
      name: "battlevel",
      indexedVals: [1, 2],
      value: 0,
      timestamp: 123456,
    },
  ],
  [
    {
      name: "cabswaps.2",
      value: 75.2,
      timestamp: 1237593,
      nameSections: ["cabswaps", "2"],
    },
    {
      isValid: true,
      name: "cabswaps",
      indexedVals: [2],
      value: 75.2,
      timestamp: 1237593,
    },
  ],
  [
    {
      name: "test.2",
      value: 75.2,
      timestamp: 1237593,
      nameSections: ["test", "2"],
    },
    {
      isValid: false,
    },
  ],
  [
    {
      name: "test.2.1",
      value: "abcd",
      timestamp: 1237593,
      nameSections: ["test", "2", "1"],
    },
    {
      isValid: false,
    },
  ],
  [
    {
      name: "test.A.1",
      value: 84.9,
      timestamp: 1237593,
      nameSections: ["test", "A", "1"],
    },
    {
      isValid: false,
    },
  ],
  [
    {
      name: "test.1.A",
      value: 84.9,
      timestamp: 1237593,
      nameSections: ["test", "1", "A"],
    },
    {
      isValid: false,
    },
  ],
];

const parseMetricFromStringTestCases = [
  [
    "testname1 32 1234567",
    {
      isValid: true,
      metric: {
        name: "testname1",
        value: "32",
        timestamp: "1234567",
      },
    },
  ],
  [
    "testname1 32",
    {
      isValid: false,
    },
  ],
  [
    "testname1",
    {
      isValid: false,
    },
  ],
  [
    "testname1 32 hello",
    {
      isValid: false,
    },
  ],
  [
    undefined,
    {
      isValid: false,
    },
  ],
];

test("metrics with missing or empty fields return invalid", () => {
  const expected = { isValid: false };

  missingFieldGeneralMetrics.forEach(m =>
    expect(parseCommonMetricFields(m)).toEqual(expected)
  );
});

test("valid metrics return expected result", () => {
  validGeneralMetricTests.forEach(t => {
    const [testCase, expected] = t;
    expect(parseCommonMetricFields(testCase)).toEqual(expected);
  });
});

test("indexed metric validation returns the expected results", () => {
  indexedMetricTests.forEach(t => {
    const [testCase, expected] = t;
    expect(parseIndexedMetric(testCase)).toEqual(expected);
  });
});

test("parse metric from string returns expected results", () => {
  parseMetricFromStringTestCases.forEach(t => {
    const [testCase, expected] = t;
    expect(parseMetricFromString(testCase)).toEqual(expected);
  });
});
