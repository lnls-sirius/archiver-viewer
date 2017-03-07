const KEY_ENTER = 13;
var ARCHIVER_URL = "http://localhost:11998";
const RETRIEVAL = "/retrieval";
const MGMT = "/mgmt";
const PV_PER_ROW = 5;
const PV_PER_ROW_DATA_TABLE = 8;
const SCALE_DEFAULTS = Chart.defaults.scale;
const TIME_AXIS_ID = "x-axis-0";
const TIME_AXIS_INDEX = 0;
const TIME_OFFSET_ALLOWED = 1 * 10 * 1000;
const REFRESH_INTERVAL = 1;
const SIZE_MIN = 1;
const SIZE_MAX = 1000;
const DEFAULT_BINS = 100;
var TRIM_STEP = 10;
const TIME_IDS = {
	YEAR : 0,
	MONTH : 1,
	WEEK_2: 2,
	WEEK_1: 3,
	DAY_25: 4,
	DAY_1 : 5,
	HOUR_18: 6,
	HOUR_12: 7,
	HOUR_8: 8,
	HOUR_4: 9,
	HOUR_2: 10,
	HOUR_1: 11,
	MIN_30: 12,
	MIN_10: 13,
	MIN_5: 14,
	MIN_1: 15,
	SEG_30: 16
};
const TRIM_LIMIT = TIME_IDS.HOUR_4;	
const TIME_AXIS_PREFERENCES = [
	{ // 1 year
		unit : "month",
		unitStepSize: 2,
		milliseconds: 365 * 24 * 3600 * 1000,
		optimized: true,
        bins: 2000,
	},
	{ // 1 month
		unit : "day",
		unitStepSize: 4,
		milliseconds:  30 * 24 * 3600 * 1000,
		optimized: true,
        bins: 250,
	},
	{ // 2 weeks
		unit : "day",
		unitStepSize: 2,
		milliseconds:  2 * 7 * 24 * 3600 * 1000, 
		optimized: true,
        bins: 250,
	},
	{ // 1 week
		unit : "day",
		unitStepSize: 2,
		milliseconds:  7 * 24 * 3600 * 1000, 
		optimized: true,
        bins: 100,
	},
	{ // 2.5 days
		unit : "hour",
		unitStepSize: 12, 
		milliseconds:  2.5 * 24 * 3600 * 1000,
		optimized: true,
        bins: 100,
	},
	{ // 1 day
		unit : "hour",
		unitStepSize: 3,
		milliseconds:  24 * 3600 * 1000,
		optimized: true,
        bins: 100,
	},
	{ // 18 hours
		unit : "hour",
		unitStepSize: 2,
		milliseconds:  18 * 3600 * 1000, 
		optimized: true,
        bins: 100,
	},
	{ // 12 hours
		unit : "hour",
		unitStepSize: 2,
		milliseconds:  12 * 3600 * 1000,
		optimized: true,
        bins: 100,
	},
	{ // 8 hours
		unit : "hour",
		unitStepSize: 2,
		milliseconds:  8 * 3600 * 1000,
		optimized: true,
        bins: 100,
	},
	{ // 4 hours
		unit : "hour",
		unitStepSize: 2,
		milliseconds:  4 * 3600 * 1000,
		optimized: true,
        bins: 100,
	},
	{ // 2 hours
		unit : "minute",
		unitStepSize: 15,
		milliseconds:  2 * 3600 * 1000, 
		optimized: true,
        bins: 100,
	},
	{ // 1 hour
		unit : "minute",
		unitStepSize: 15,
		milliseconds:  3600 * 1000, 
		optimized: false,
	},
	{ // 30 minutes
		unit : "minute",
		unitStepSize: 3,
		milliseconds: 30 * 60 * 1000,
		optimized: false,
	},
	{ // 10 minutes
		unit : "minute",
		unitStepSize: 2,
		milliseconds: 10 * 60 * 1000,
		optimized: false,
	},
	{ // 5 minutes
		unit : "second",
		unitStepSize: 30,
		milliseconds: 5 * 60 * 1000,
		optimized: false,
	},
	{ // 1 minute
		unit : "second",
		unitStepSize: 15,
		milliseconds: 60 * 1000,
		optimized: false,
	},
	{ // 30 seconds
		unit : "second",
		unitStepSize: 3,
		milliseconds: 30 * 1000,
		optimized: false,
	}
];
