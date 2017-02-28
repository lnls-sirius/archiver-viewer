data_offset = [ 
	{ "meta": { "name": "Cont:LNLS191:NTP:Offset" , "EGU": "millise" , "PREC": "3" },
		"data": [ 
		{ "secs": 1488221819, "val": 0.0010000000474974513, "nanos": 301356034, "severity":0, "status":0 },
		{ "secs": 1488221843, "val": 0.0020000000949949026, "nanos": 301392773, "severity":0, "status":0 },
		{ "secs": 1488221851, "val": -0.0020000000949949026, "nanos": 301401315, "severity":0, "status":0 },
		{ "secs": 1488221859, "val": -0.0010000000474974513, "nanos": 301363823, "severity":0, "status":0 },
		{ "secs": 1488221867, "val": -0.0020000000949949026, "nanos": 301370771, "severity":0, "status":0 },
		{ "secs": 1488221883, "val": 0.0010000000474974513, "nanos": 301406628, "severity":0, "status":0 },
		{ "secs": 1488221891, "val": -0.0010000000474974513, "nanos": 301338904, "severity":0, "status":0 },
		{ "secs": 1488221899, "val": -0.0020000000949949026, "nanos": 301372992, "severity":0, "status":0 },
		{ "secs": 1488221907, "val": -0.0010000000474974513, "nanos": 301575228, "severity":0, "status":0 },
		{ "secs": 1488221915, "val": 0.0, "nanos": 301329883, "severity":0, "status":0 },
		{ "secs": 1488221931, "val": 0.004000000189989805, "nanos": 301359864, "severity":0, "status":0 },
		{ "secs": 1488221939, "val": 0.0, "nanos": 301365852, "severity":0, "status":0 },
		{ "secs": 1488221947, "val": -0.0010000000474974513, "nanos": 301347317, "severity":0, "status":0 },
		{ "secs": 1488221963, "val": 0.0, "nanos": 301375894, "severity":0, "status":0 },
		{ "secs": 1488221987, "val": 0.0010000000474974513, "nanos": 301555825, "severity":0, "status":0 },
		{ "secs": 1488221995, "val": 0.0, "nanos": 301290716, "severity":0, "status":0 }] }
		 ];

data_gps_fix = [ 
	{ "meta": { "name": "Cont:LNLS191:GPS:Fix" , "PREC": "0" },
		"data": [ 
		{ "secs": 1488199039, "val": 3, "nanos": 986060160, "severity":0, "status":0 },
		{ "secs": 1488200649, "val": 0, "nanos": 986797554, "severity":2, "status":7 },
		{ "secs": 1488200655, "val": 3, "nanos": 63001083, "severity":0, "status":0 },
		{ "secs": 1488200719, "val": 0, "nanos": 985854599, "severity":2, "status":7 },
		{ "secs": 1488200725, "val": 3, "nanos": 63098213, "severity":0, "status":0 },
		{ "secs": 1488201145, "val": 0, "nanos": 62891828, "severity":2, "status":7 },
		{ "secs": 1488201165, "val": 3, "nanos": 63143586, "severity":0, "status":0 }] }
		 ];

$(document).ready(function () {


	setEndTime(new Date(), true);
	
	addDataset(viewer, data_offset);
	
	addDataset(viewer, data_gps_fix);
});
