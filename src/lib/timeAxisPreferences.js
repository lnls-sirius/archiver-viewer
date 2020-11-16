const TIME_AXIS_ID = "x-axis-0";
const TIME_AXIS_INDEX = 0;
const TIME_IDS = {
  YEAR: 0,
  MONTH: 1,
  WEEK2: 2,
  WEEK1: 3,
  DAY25: 4,
  DAY1: 5,
  HOUR18: 6,
  HOUR12: 7,
  HOUR_8: 8,
  HOUR_4: 9,
  HOUR2: 10,
  HOUR1: 11,
  MIN_30: 12,
  MIN10: 13,
  MIN_5: 14,
  MIN1: 15,
  SEG_30: 16,
};
const TIME_AXIS_PREFERENCES = [
  {
    // 1 year
    text: "1Y",
    unit: "month",
    unitStepSize: 2,
    milliseconds: 365 * 24 * 3600 * 1000,
    optimized: true,
    bins: 2000,
    id: TIME_IDS.YEAR,
  },
  {
    // 1 month
    text: "1M",
    unit: "day",
    unitStepSize: 4,
    milliseconds: 30 * 24 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.MONTH,
  },
  {
    // 2 weeks
    text: "2w",
    unit: "day",
    unitStepSize: 2,
    milliseconds: 2 * 7 * 24 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.WEEK2,
  },
  {
    // 1 week
    text: "1w",
    unit: "day",
    unitStepSize: 2,
    milliseconds: 7 * 24 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.WEEK1,
  },
  {
    // 2.5 days
    text: "2.5d",
    unit: "hour",
    unitStepSize: 12,
    milliseconds: 2.5 * 24 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.DAY25,
  },
  {
    // 1 day
    text: "1d",
    unit: "hour",
    unitStepSize: 3,
    milliseconds: 24 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.DAY1,
  },
  {
    // 18 hours
    text: "18h",
    unit: "hour",
    unitStepSize: 2,
    milliseconds: 18 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.HOUR18,
  },
  {
    // 12 hours
    text: "12h",
    unit: "hour",
    unitStepSize: 2,
    milliseconds: 12 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.HOUR12,
  },
  {
    // 8 hours
    text: "8h",
    unit: "hour",
    unitStepSize: 2,
    milliseconds: 8 * 3600 * 1000,
    optimized: true,
    bins: 800,
    id: TIME_IDS.HOUR_8,
  },
  {
    // 4 hours
    text: "4h",
    unit: "hour",
    unitStepSize: 2,
    milliseconds: 4 * 3600 * 1000,
    optimized: true,
    bins: 400,
    id: TIME_IDS.HOUR_4,
  },
  {
    // 2 hours
    text: "2h",
    unit: "minute",
    unitStepSize: 15,
    milliseconds: 2 * 3600 * 1000,
    optimized: true,
    bins: 400,
    id: TIME_IDS.HOUR2,
  },
  {
    // 1 hour
    text: "1h",
    unit: "minute",
    unitStepSize: 15,
    milliseconds: 3600 * 1000,
    optimized: false,
    bins: 200,
    id: TIME_IDS.HOUR1,
  },
  {
    // 30 minutes
    text: "30m",
    unit: "minute",
    unitStepSize: 3,
    milliseconds: 30 * 60 * 1000,
    optimized: false,
    bins: 200,
    id: TIME_IDS.MIN_30,
  },
  {
    // 10 minutes
    text: "10m",
    unit: "minute",
    unitStepSize: 2,
    milliseconds: 10 * 60 * 1000,
    optimized: false,
    bins: 50,
    id: TIME_IDS.MIN10,
  },
  {
    // 5 minutes
    text: "5m",
    unit: "second",
    unitStepSize: 30,
    milliseconds: 5 * 60 * 1000,
    optimized: false,
    bins: 50,
    id: TIME_IDS.MIN_5,
  },
  {
    // 1 minute
    text: "1m",
    unit: "second",
    unitStepSize: 15,
    milliseconds: 60 * 1000,
    optimized: false,
    bins: 50,
    id: TIME_IDS.MIN1,
  },
  {
    // 30 seconds
    text: "30s",
    unit: "second",
    unitStepSize: 3,
    milliseconds: 30 * 1000,
    optimized: false,
    bins: 50,
    id: TIME_IDS.SEG_30,
  },
];
export { TIME_AXIS_ID, TIME_AXIS_INDEX, TIME_AXIS_PREFERENCES, TIME_IDS };
