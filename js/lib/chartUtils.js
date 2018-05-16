/******* Chart control functions *******/

/* Module dependencies */
var $ = require('jquery-browserify');

module.exports = (function () {

    const TIME_AXIS_ID = "x-axis-0";
    const TIME_AXIS_INDEX = 0;
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
            	bins: 800,
	    },
	    { // 2 weeks
		    unit : "day",
		    unitStepSize: 2,
		    milliseconds:  2 * 7 * 24 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 1 week
		    unit : "day",
		    unitStepSize: 2,
		    milliseconds:  7 * 24 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 2.5 days
		    unit : "hour",
		    unitStepSize: 12,
		    milliseconds:  2.5 * 24 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 1 day
		    unit : "hour",
		    unitStepSize: 3,
		    milliseconds:  24 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 18 hours
		    unit : "hour",
		    unitStepSize: 2,
		    milliseconds:  18 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 12 hours
		    unit : "hour",
		    unitStepSize: 2,
		    milliseconds:  12 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 8 hours
		    unit : "hour",
		    unitStepSize: 2,
		    milliseconds:  8 * 3600 * 1000,
		    optimized: true,
            	bins: 800,
	    },
	    { // 4 hours
		    unit : "hour",
		    unitStepSize: 2,
		    milliseconds:  4 * 3600 * 1000,
		    optimized: true,
            	bins: 400,
	    },
	    { // 2 hours
		    unit : "minute",
		    unitStepSize: 15,
		    milliseconds:  2 * 3600 * 1000,
		    optimized: true,
            	bins: 400,
	    },
	    { // 1 hour
		    unit : "minute",
		    unitStepSize: 15,
		    milliseconds:  3600 * 1000,
		    optimized: false,
		    bins: 200,
	    },
	    { // 30 minutes
		    unit : "minute",
		    unitStepSize: 3,
		    milliseconds: 30 * 60 * 1000,
		    optimized: false,
		    bins: 200,
	    },
	    { // 10 minutes
		    unit : "minute",
		    unitStepSize: 2,
		    milliseconds: 10 * 60 * 1000,
		    optimized: false,
		    bins: 50,
	    },
	    { // 5 minutes
		    unit : "second",
		    unitStepSize: 30,
		    milliseconds: 5 * 60 * 1000,
		    optimized: false,
		    bins: 50,
	    },
	    { // 1 minute
		    unit : "second",
		    unitStepSize: 15,
		    milliseconds: 60 * 1000,
		    optimized: false,
		    bins: 50,
	    },
	    { // 30 seconds
		    unit : "second",
		    unitStepSize: 3,
		    milliseconds: 30 * 1000,
		    optimized: false,
		    bins: 50,
	    }
    ];
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

    var yAxisUseCounter = [];

    var colorStack = [
        "rgba(245, 130, 48, 1.0)",
        "rgba(145, 30, 180, 1.0)",
        "rgba(70, 240, 240, 1.0)",
        "rgba(240, 50, 230 ,1.0)",
        "rgba(210, 245, 60, 1.0)",
        "rgba(250, 190, 190, 1.0)",
        "rgba(0, 128, 128, 1.0)",
        "rgba(230, 190, 255, 1.0)",
        "rgba(170, 110, 40, 1.0)",
        "rgba(128, 0, 0, 1.0)",
        "rgba(170, 255, 195, 1.0)",
        "rgba(255, 225, 25, 1.0)",
        "rgba(0, 130, 200, 1.0)",
        "rgba(128, 128, 128, 1.0)",
        "rgba(0, 0, 0, 1.0)",
        "rgba(230, 25, 75, 1.0)",
        "rgba(60, 180, 75, 1.0)",
        "rgba(0, 0, 128, 1.0)",
    ];

    var axisPositionLeft = true;

    /**
    * Updates chart's time axes, but does not updates it by calling update(0, false).
    **/
    var updateTimeAxis = function (chart, unit, unitStepSize, from, to) {

        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.unit = unit;
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.stepSize = unitStepSize;
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.min = from;
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.max = to;
    };

    /**
    * Adds a new vertical axis to the chart.
    **/
    var appendDataAxis = function (chart, n_id, ticks_precision) {

        if (n_id in yAxisUseCounter) {

            /* Increments the number of times this axis is used by a PV. */
            yAxisUseCounter[n_id]++;
            return ;
        }

        /* yAxisUseCounter[n_id] stands for the times this axis is used */
        yAxisUseCounter[n_id] = 1;

        /* Extends the default scale options for the axis */
        var scaleOptions = jQuery.extend(true, {}, Chart.defaults.scale);

        if (ticks_precision == undefined)
            ticks_precision = 3;

        scaleOptions.type = "linear";
        scaleOptions.position = axisPositionLeft ? "left" : "right",
        scaleOptions.id = n_id;

        scaleOptions.scaleLabel.display = true;
        scaleOptions.scaleLabel.labelString = n_id;

        if (Object.keys(yAxisUseCounter).length > 1)
            scaleOptions.gridLines.borderDash = [5, 5 * Object.keys(yAxisUseCounter).length];

        //scaleOptions.ticks.maxTicksLimit = 5;
        scaleOptions.ticks.minor.display = true;
        scaleOptions.ticks.minor.padding = 0;
        scaleOptions.ticks.minor.labelOffset = 0;

        // Function which is called when the scale is being drawn.
        scaleOptions.ticks.callback = function (value) {

            if (value != 0 && Math.abs(value) < Math.pow(10, -ticks_precision))
                return value.toExponential (ticks_precision)

            /* ticks_precision stands for the number of decimal cases shown by the plot in the vertical axis */
            if (ticks_precision > 4)
                return value.toExponential(3)

            return value.toFixed(ticks_precision);
        };

        var scaleClass = Chart.scaleService.getScaleConstructor("linear");

        var n_scale = new scaleClass({
            id: n_id,
            options: scaleOptions,
            ctx: chart.ctx,
            chart: chart,
            position: axisPositionLeft ? "left" : "right",
        });

        axisPositionLeft = !axisPositionLeft;

        /* Stores a reference of the axis */
        chart.scales[n_id] = n_scale;

        /* Appends it into the chart */
        Chart.layoutService.addBox(chart, n_scale);
    };

    var appendDataset = function (chart, pv_name, data, samplingPeriod, type, unit, bins, precision, desc) {

        // Parses the data fetched from the archiver the way that the chart's internal classes can plot
        var color = colorStack.pop ();

        if (unit == undefined)
            unit = pv_name;

        unit = unit.replace ("?", "o");

        // Adds a new vertical axis if no other with the same unit exists
        appendDataAxis(chart, unit, precision)

        // Pushes it into the chart
        chart.data.datasets.push({

            label : pv_name,
            xAxisID: TIME_AXIS_ID,
            yAxisID: unit,
            borderWidth: 1.5,
            data : data,
            showLine : true,
            steppedLine : true,
            fill : false,
            pointRadius : 0,
            backgroundColor : color,
            borderColor: color,

            pv: {
                precision: precision,
                type: type,
                samplingPeriod: samplingPeriod,
                optimized : bins < 0 ? false : true,
                desc: desc,
            },
        });
    };

    var hidesAxis = function (metadata, chart) {

        if (metadata.hidden) {

            yAxisUseCounter [metadata.yAxisID]++
            chart.scales [metadata.yAxisID].options.display = true;

            metadata.hidden = null;
        }
        else {

            metadata.hidden = true;
            yAxisUseCounter[metadata.yAxisID]--;

            if (yAxisUseCounter[metadata.yAxisID] <= 0)
                chart.scales[metadata.yAxisID].options.display = false;
        }

    }

    /**
    * Decides if a y axis should be displayed or not.
    **/
    var legendCallback = function(e, legendItem) {

        var meta = this.chart.getDatasetMeta(legendItem.datasetIndex);

        hidesAxis (meta, this.chart);

        this.chart.update(0, false);
    };

    /**
    * Edits tooltip's label before printing them in the screen.
    **/
    var labelCallback = function (label, chart) {

        if (label.yLabel != 0 && Math.abs(label.yLabel) < Math.pow(10, -chart.datasets[label.datasetIndex].pv.precision))
            return chart.datasets[label.datasetIndex].label + ": " + label.yLabel.toExponential (Math.min(3, chart.datasets[label.datasetIndex].pv.precision))

        if (chart.datasets[label.datasetIndex].pv.precision > 4)
            return chart.datasets[label.datasetIndex].label + ": " + label.yLabel.toExponential(3) ;

        return chart.datasets[label.datasetIndex].label + ": " +  label.yLabel.toFixed(chart.datasets[label.datasetIndex].pv.precision);
    };

    return {

        /* const references */
        timeAxisID: TIME_AXIS_ID,
        timeAxisPreferences: TIME_AXIS_PREFERENCES,
        timeIDs: TIME_IDS,

        /* Getters */
        yAxisUseCounter: function () { return yAxisUseCounter; },
        colorStack: function () { return colorStack; },
        axisPositionLeft: function () { return axisPositionLeft; },

        /* Setters */
        updateAxisPositionLeft: function (a) { axisPositionLeft = a; } ,

        updateTimeAxis: updateTimeAxis,
        appendDataAxis: appendDataAxis,
        appendDataset: appendDataset,
        hidesAxis: hidesAxis,
        legendCallback: legendCallback,
        labelCallback: labelCallback,
    };

}) ();
