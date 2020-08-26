/******* Chart control functions *******/
module.exports = (function() {

    const TIME_AXIS_ID = "x-axis-0";
    const TIME_AXIS_INDEX = 0;
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
    const TIME_AXIS_PREFERENCES = [
        { // 1 year
            text:'1Y',
            unit : "month",
            unitStepSize: 2,
            milliseconds: 365 * 24 * 3600 * 1000,
            optimized: true,
            bins: 2000,
            id:TIME_IDS.YEAR
        },
        { // 1 month
            text:'1M',
            unit : "day",
            unitStepSize: 4,
            milliseconds:  30 * 24 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.MONTH
        },
        { // 2 weeks
            text:'2w',
            unit : "day",
            unitStepSize: 2,
            milliseconds:  2 * 7 * 24 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.WEEK_2
        },
        { // 1 week
            text:'1w',
            unit : "day",
            unitStepSize: 2,
            milliseconds:  7 * 24 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.WEEK_1
        },
        { // 2.5 days
            text:'2.5d',
            unit : "hour",
            unitStepSize: 12,
            milliseconds:  2.5 * 24 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.DAY_25
        },
        { // 1 day
            text:'1d',
            unit : "hour",
            unitStepSize: 3,
            milliseconds:  24 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.DAY_1
        },
        { // 18 hours
            text:'18h',
            unit : "hour",
            unitStepSize: 2,
            milliseconds:  18 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.HOUR_18
        },
        { // 12 hours
            text:'12h',
            unit : "hour",
            unitStepSize: 2,
            milliseconds:  12 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.HOUR_12
        },
        { // 8 hours
            text:'8h',
            unit : "hour",
            unitStepSize: 2,
            milliseconds:  8 * 3600 * 1000,
            optimized: true,
            bins: 800,
            id:TIME_IDS.HOUR_8
        },
        { // 4 hours
            text:'4h',
            unit : "hour",
            unitStepSize: 2,
            milliseconds:  4 * 3600 * 1000,
            optimized: true,
            bins: 400,
            id:TIME_IDS.HOUR_4
        },
        { // 2 hours
            text:'2h',
            unit : "minute",
            unitStepSize: 15,
            milliseconds:  2 * 3600 * 1000,
            optimized: true,
            bins: 400,
            id:TIME_IDS.HOUR_2
        },
        { // 1 hour
            text:'1h',
            unit : "minute",
            unitStepSize: 15,
            milliseconds:  3600 * 1000,
            optimized: false,
            bins: 200,
            id:TIME_IDS.HOUR_1
        },
        { // 30 minutes
            text:'30m',
            unit : "minute",
            unitStepSize: 3,
            milliseconds: 30 * 60 * 1000,
            optimized: false,
            bins: 200,
            id:TIME_IDS.MIN_30
        },
        { // 10 minutes
            text:'10m',
            unit : "minute",
            unitStepSize: 2,
            milliseconds: 10 * 60 * 1000,
            optimized: false,
            bins: 50,
            id:TIME_IDS.MIN_10
        },
        { // 5 minutes
            text:'5m',
            unit : "second",
            unitStepSize: 30,
            milliseconds: 5 * 60 * 1000,
            optimized: false,
            bins: 50,
            id:TIME_IDS.MIN_5
        },
        { // 1 minute
            text:'1m',
            unit : "second",
            unitStepSize: 15,
            milliseconds: 60 * 1000,
            optimized: false,
            bins: 50,
            id:TIME_IDS.MIN_1
        },
        { // 30 seconds
            text:'30s',
            unit : "second",
            unitStepSize: 3,
            milliseconds: 30 * 1000,
            optimized: false,
            bins: 50,
            id:TIME_IDS.SEG_30
        }
    ];

    var yAxisUseCounter = [];

    var randomColorGenerator = function() {
        return '#' +(Math.random().toString(16) + '0000000').slice(2, 8);
    };

    var colorStack = [
        "rgba(255, 0, 0, 1.0)",
        "rgba(0, 255, 0, 1.0)",
        "rgba(0, 0, 255, 1.0)",
        "rgba(255, 10, 0, 1.0)",
        "rgba(10, 255, 0, 1.0)",
        "rgba(10, 10, 255, 1.0)",
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
    var updateTimeAxis = function(chart, unit, unitStepSize, from, to) {
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.unit = unit;
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.stepSize = unitStepSize;
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.min = from;
        chart.options.scales.xAxes[TIME_AXIS_INDEX].time.max = to;
    };

    var toggleAxisType = (chart, axisId, isLogarithmic )=>{
        if(chart.options.scales.yAxes.length <= 1)
            return;

        for(let i=1; i < chart.options.scales.yAxes.length; i++){
            if(chart.options.scales.yAxes[i].id == axisId){
                if(isLogarithmic){
                    chart.options.scales.yAxes[i].type = 'logarithmic';
		    //chart.options.scales.yAxes[i].ticks.maxTicksLimit = 25;
                }else{
                    chart.options.scales.yAxes[i].type = 'linear';
                }
                chart.update();
            }
        }
    }

    var toggleAutoY = (chart, axisId, autoFire) => {
    var table = $(autoFire).closest(".data_axis_table").find(":text");
    
    for (let i = 1; i < chart.options.scales.yAxes.length; i++) {
        if (chart.options.scales.yAxes[i].id == axisId) {
	    table = table.slice((i-1)*2,(i-1)*2+2);
	    table.toggle();
            if (autoFire.checked) {
                for (let j = 0; j < table.length; j++) {
                    var limit = parseFloat(table[j].value);
                    if (!isNaN(limit)) {
                        if ($(table[j]).attr("placeholder") === "Max") {
                            chart.options.scales.yAxes[i].ticks.max = limit;
                        } else {
                            chart.options.scales.yAxes[i].ticks.min = limit;
                        }
                        chart.update();
                    }
                }
          } else {
        delete chart.options.scales.yAxes[i].ticks.max;
        delete chart.options.scales.yAxes[i].ticks.min;
 	}
    }
    }
    chart.update();
    }

    var changeYLimit = (chart, axisId, limitInput )=>{
	if(chart.options.scales.yAxes.length <= 1)
            return;

        for(let i=1; i < chart.options.scales.yAxes.length; i++){
            if(chart.options.scales.yAxes[i].id == axisId){
		var limit = parseFloat(limitInput.value);
		if($(limitInput).attr("placeholder") === "Max")
		{
		    if(!isNaN(limit))
		    {
                        chart.options.scales.yAxes[i].ticks.max =  limit;
		    }
		    else
		    {
			delete chart.options.scales.yAxes[i].ticks.max;
		    }
		} else {
		    if(!isNaN(limit))
                    {
			chart.options.scales.yAxes[i].ticks.min =  limit;
		    }
		    else
                    {
                        delete chart.options.scales.yAxes[i].ticks.min;
                    }

		}
                chart.update();
            }
        }
    }

    var getAxesInUse = (axes)=> {
        if(axes == null || axes.length <= 1){ return []; }

        var axesInUse = [];
        axes.forEach(element => {
            if(element.id in yAxisUseCounter && yAxisUseCounter[element.id] > 0){
                axesInUse.push(element);
            }
        });
        return axesInUse;
    }

    /** Adds a new vertical axis to the chart. */
    var appendDataAxis = function(chart, n_id, ticks_precision) {
	if(n_id in yAxisUseCounter) {
            /* Increments the number of times this axis is used by a PV. */
            yAxisUseCounter[n_id]++;
            return ;
        }

        /* yAxisUseCounter[n_id] stands for the times this axis is used */
        yAxisUseCounter[n_id] = 1;

        if(ticks_precision == undefined)
            ticks_precision = 3;

        // Function which is called when the scale is being drawn.
        var ticks_cb = function(value) {

            if(value != 0 && Math.abs(value) < Math.pow(10, -ticks_precision)){ return value.toExponential(ticks_precision) }
            /* ticks_precision stands for the number of decimal cases shown by the plot in the vertical axis */
            if(ticks_precision > 4){ return value.toExponential(3); }
            return value.toFixed(ticks_precision);
        };
        // @todo: Add back vertical border dash
        // borderDash = [5, 5 * Object.keys(yAxisUseCounter).length];
        chart.options.scales.yAxes.push(
            {
                id: n_id,
                type: 'linear',
                display: true,
                position: axisPositionLeft ? "left" : "right",
                ticks: {
                    callback: ticks_cb,
                    minor:{
                        display : true,
                        padding: 0,
                        labelOffset: 0
                    },
                },
                scaleLabel:{
                    display: true,
                    labelString: n_id
                }
            }
        );
        axisPositionLeft = (axisPositionLeft)?false:true;
        chart.update();
    };

    var appendDataset = function(chart, data, bins, precision, metadata) {
        let samplingPeriod = parseFloat(metadata['samplingPeriod']);
        let pv_name = metadata['pvName'];
        let desc = metadata['DESC'];
        let type = metadata["DBRType"];
        let unit = (metadata["EGU"] != "" || metadata["EGU"] == undefined) ? metadata["EGU"] : metadata['pvName'];

        // Parses the data fetched from the archiver the way that the chart's internal classes can plot
        let color = (colorStack.length > 0)?colorStack.pop():randomColorGenerator();

        if(unit == undefined)
            unit = pv_name;

        unit = unit.replace("?", "o");

        // Adds a new vertical axis if no other with the same unit exists
        appendDataAxis(chart, unit, precision);

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
                egu: unit,
                metadata: metadata
            },
        });
	
	chart.update();
    };

    var hidesAxis = function(metadata, chart) {
        if(metadata.hidden) {
            yAxisUseCounter [metadata.yAxisID]++
            chart.scales [metadata.yAxisID].options.display = true;
            metadata.hidden = null;
        } else {
            metadata.hidden = true;
            yAxisUseCounter[metadata.yAxisID]--;
            if(yAxisUseCounter[metadata.yAxisID] <= 0)
                chart.scales[metadata.yAxisID].options.display = false;
        }
    }

    /**
    * Decides if a y axis should be displayed or not.
    **/
    var legendCallback = function(e, legendItem) {
        var meta = this.chart.getDatasetMeta(legendItem.datasetIndex);

        hidesAxis(meta, this.chart);

        this.chart.update(0, false);
    };

    /**
    * Edits tooltip's label before printing them in the screen.
    **/
    var labelCallback = function(label, chart) {
        if(label.yLabel != 0 && Math.abs(label.yLabel) < Math.pow(10, -chart.datasets[label.datasetIndex].pv.precision))
            return chart.datasets[label.datasetIndex].label + ": " + label.yLabel.toExponential(Math.min(3, chart.datasets[label.datasetIndex].pv.precision));

        if(chart.datasets[label.datasetIndex].pv.precision > 4)
            return chart.datasets[label.datasetIndex].label + ": " + label.yLabel.toExponential(3);

	return chart.datasets[label.datasetIndex].label + ": " +  label.yLabel.toFixed(chart.datasets[label.datasetIndex].pv.precision);
    };

    var reboundTooltip = function (x, y, tooltip, factor) {
        let tooltipWidth = tooltip.width;
        let tooltipHeight = tooltip.height;
        let coordinates = {x:0, y:y};

        if(x > tooltip._chart.width - (tooltipWidth + 10)) {
            coordinates.x = x - tooltipWidth - 5;
        } else {
            coordinates.x = x + 5;
        }

        /*if(y > tooltip._chart.height - (tooltipHeight + 10)) {
            coordinates.y = y + tooltipHeight - 5;
        } else {
            coordinates.y = y - tooltipHeight*factor + 5;
        }*/
	coordinates.y = y - tooltipHeight*factor + 5;

        return coordinates;
    };

    Chart.Tooltip.positioners.cursor = function(chartElements, coordinates) {
	// This exists to override default Chartjs behavior. It does not cause the whole tooltip element to be rerendered.
	// As yAlign and xAlign properties are set to 'no-transform', we have to give an absolute position for the tooltip, this occurs in conjunction with the eventHandler in control.js.
	return reboundTooltip(coordinates.x, coordinates.y, this, 0);
     };

    var customTooltips = function(tooltip) {
			if(tooltip.dataPoints != undefined){
			var i;
			for(i = 1; i < tooltip.dataPoints.length; i++){
				if(tooltip.dataPoints[i].backgroundColor != undefined){
					tooltip.labelColors.push({
					backgroundColor: tooltip.dataPoints[i].backgroundColor,
					borderColor: tooltip.dataPoints[i].borderColor
					});
					tooltip.labelTextColors.push('#fff');
				}
			}
			}
		};

    return {

        /* const references */
        timeAxisID: TIME_AXIS_ID,
        timeAxisPreferences: TIME_AXIS_PREFERENCES,
        timeIDs: TIME_IDS,

        /* Getters */
        getAxesInUse: getAxesInUse,
        yAxisUseCounter: function() { return yAxisUseCounter; },
        colorStack: function() { return colorStack; },
        axisPositionLeft: function() { return axisPositionLeft; },

        /* Setters */
        updateAxisPositionLeft: function(a) { axisPositionLeft = a; } ,
        toggleAxisType: toggleAxisType,
	toggleAutoY: toggleAutoY,
	changeYLimit: changeYLimit,
        updateTimeAxis: updateTimeAxis,
        appendDataAxis: appendDataAxis,
        appendDataset: appendDataset,
        hidesAxis: hidesAxis,
        legendCallback: legendCallback,
        labelCallback: labelCallback,
	customTooltips: customTooltips,
	reboundTooltip: reboundTooltip,
	randomColorGenerator: randomColorGenerator
    };

})();
