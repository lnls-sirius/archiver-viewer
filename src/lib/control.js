/******* Time window control functions *******/
/**
* The following functions control the start and end time that will be plotted on the graph.
* end stands for the most recent time, meanwhile start
* stands for the beginning of the window time.
*/
/* require archInterface, chartUtils */

/* Module dependencies */
var ui = require ("./ui.js");
var chartUtils = require ("./chartUtils.js");
var archInterface = require ("./archInterface.js");
var handlers = require("./handlers.js");

module.exports = (function () {

    const DATA_VOLUME_MAX = 5000;

    const STACK_ACTIONS = {
        REMOVE_PV : 0,
        APPEND_PV : 1,
        CHANGE_WINDOW_TIME : 2,
        CHANGE_END_TIME : 3,
        CHANGE_START_TIME : 4,
        ZOOM : 5,
    };

    const REFERENCE = {
        START : 0,
        END : 1,
    };


    /* chartjs instance reference */
    var chart = null;

    /* start and end timedates */
    var start, end, reference = REFERENCE.END;

    var window_time = chartUtils.timeIDs.MIN_10;

    var timer = null;

    /* Control flags */
    var auto_enabled = false;
    var singleTip_enabled = true;
    var scrolling_enabled = true;
    var serverDate_enabled = true;

    var drag_flags = {
        drag_started: false,
        updateOnComplete: true,
    };

    var zoom_flags = {
        isZooming: false,
        hasBegan: false,
    };

    var undo_stack = [], redo_stack = [];

    var init = function (c) {
        chart = c;
	};

    let parentEventHandler = Chart.Controller.prototype.eventHandler;
    Chart.Controller.prototype.eventHandler = function () {
	// This is not a duplicate of the cursor positioner, this handler is called when a tooltip's datapoint index does not change.
	let ret = parentEventHandler.apply(this, arguments);
	let tooltipWidth = this.tooltip._model.width;
        let tooltipHeight = this.tooltip._model.height;
	
	if(!singleTip_enabled){
    	    let x = arguments[0].x;
    	    let y = arguments[0].y;
    	    this.clear();
    	    this.draw();
    	    let yScale = this.scales['y-axis-0'];
    	    this.chart.ctx.beginPath();
    	    this.chart.ctx.moveTo(x, yScale.getPixelForValue(yScale.max));
    	    this.chart.ctx.strokeStyle = "#ff0000";
    	    this.chart.ctx.lineTo(x, yScale.getPixelForValue(yScale.min));
    	    this.chart.ctx.stroke();
	}

	    this.tooltip.width = this.tooltip._model.width;
	    this.tooltip.height = this.tooltip._model.height;	

	    let coordinates = chartUtils.reboundTooltip(arguments[0].x, arguments[0].y, this.tooltip, 0.5);
	
            this.tooltip._model.x = coordinates.x;
	    this.tooltip._model.y = coordinates.y;

    	    return ret;
    };

    async function updateTimeWindow(window) {

       // ui.toogleWindowButton (window, window_time);

        window_time = window;

        if (window_time < chartUtils.timeIDs.MIN_30) {

            if (auto_enabled) {

                auto_enabled = false;

                clearInterval(timer);
/*
                ui.enableDate();
                ui.enable ($("#date span.now"));
                ui.enable ($("#date span.zoom"));
                ui.enable ($("#date span.forward"));
                ui.enable ($("#date span.backward"));

                $("#date img").css({"cursor" : "pointer"});*/
            }

/*            ui.disable ($("#date span.auto"));*/
        }
        else if (!auto_enabled)
            ui.enable ($("#date span.auto"));

        if (reference == REFERENCE.END)
            start = new Date(end.getTime() - chartUtils.timeAxisPreferences[window_time].milliseconds);

        else if (reference == REFERENCE.START) {

            var now = new Date();

            if (start.getTime() + chartUtils.timeAxisPreferences[window_time].milliseconds <= now.getTime())
                end = new Date(start.getTime() + chartUtils.timeAxisPreferences[window_time].milliseconds);
            else end = now;
        }

        optimizeAllGraphs ();
        updateAllPlots(true);
        updateURL();
        chartUtils.updateTimeAxis (chart, chartUtils.timeAxisPreferences[window_time].unit, chartUtils.timeAxisPreferences[window_time].unitStepSize, start, end);
        chart.update();

        ui.disableLoading();

        /*
        if (document.getElementsByClassName('enable_table')[0].checked) {
            updateDataTable();
            $('#data_table_area .data_table').show();
        }
        */
    }

    /**
    * Appends a new variable into the chart.
    **/
    async function appendPV(pv, optimized, undo) {
        if (chartUtils.colorStack().length == 0) {
            console.log('Color stack limit reached. A random color will be used for pv ' + pv + '.');
        }

        // Asks for the PV's metadata
        var metadata = await archInterface.fetchMetadata(
            pv, ()=>{ui.toogleSearchWarning("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown)});
                
        if(metadata == null){
            console.log('No metadata for ', pv);
            return -1;
        }
        var bins = shouldOptimizeRequest(parseFloat(metadata["samplingPeriod"]), metadata["DBRType"]);

        if (optimized == false){
            bins = -1;
        }else if (optimized && bins == -1){
            bins = chartUtils.timeAxisPreferences[window_time].bins;
        }
        var data = await archInterface.fetchData(pv, start, end, bins < 0 ? false : true, bins, handlers.handleFetchDataError, ui.enableLoading);
        if (data == undefined || data == null || data[0].data.length == 0){
            ui.toogleSearchWarning ("No data was received from server.");
            console.log('No data received from server. ', pv);
        }else{
            chartUtils.appendDataset(chart, improveData(archInterface.parseData(data[0].data)), bins, parseInt(data[0].meta.PREC) + 1, metadata);
            handleDataAxisInfoTableUpdate();
        }

	updateOptimizedWarning();
        updateURL();

        ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);

        if (!undo || undo == undefined)
            undo_stack.push ({action : STACK_ACTIONS.APPEND_PV, pv : pv});
	ui.disableLoading();
    }

    /**
    * Checks if the request must optimized because of the variable's data volume. It returns -1 if no optimization is required or the number of bins otherwise.
    **/
    var shouldOptimizeRequest = function (samplingPeriod, type) {

        if (type == "DBR_SCALAR_ENUM")
            return -1;

        /*
        var dataEstimative = chartUtils.timeAxisPreferences[window_time].milliseconds / (1000 * samplingPeriod);

        if (dataEstimative > DATA_VOLUME_MAX)
            return chartUtils.timeAxisPreferences[window_time].bins;
        */

        if (window_time < chartUtils.timeIDs.HOUR_2)
            return chartUtils.timeAxisPreferences[window_time].bins;

        return -1;
    }

    /******* Update functions *******/
    /**
    * The following functions updates the data plotted by the chart. They are called by
    * the event handlers mostly.
    **/

    /**
    * Sets end to date and updates start according
    * to the time window size. Updates HTML elements in the case updateHtml is true.
    **/
    async function updateStartAndEnd(date, updateHtml, undo) {
	if(date === undefined){date = new Date();}
	
        if (updateHtml == undefined || updateHtml == null)
            updateHtml = false;

	var now = await getDateNow() || new Date(); // Guarantees that the chart will respect date boundaries

        if (reference == REFERENCE.END) {

            if (!undo || undo == undefined)
                undo_stack.push ({action: STACK_ACTIONS.CHANGE_END_TIME, end_time: end});

            if (date.getTime() <= now.getTime())
                end = date;
            else end = now;

            start = new Date(end.getTime() - chartUtils.timeAxisPreferences[window_time].milliseconds);

            if (updateHtml) ui.updateDateComponents (end);
        }
        else {

            if (!undo || undo == undefined)
                undo_stack.push ({action: STACK_ACTIONS.CHANGE_START_TIME, start_time: start});

            if (date.getTime() + chartUtils.timeAxisPreferences[window_time].milliseconds <= now.getTime()) {
                start = date;
                end = new Date (date.getTime() + chartUtils.timeAxisPreferences[window_time].milliseconds);
            }
            else {
                start = new Date(now.getTime() - chartUtils.timeAxisPreferences[window_time].milliseconds);
                end = now;
            }

            if (updateHtml) ui.updateDateComponents (start);
        }

	ui.disableLoading();
    };

    var updateOptimizedWarning = function () {

        var can_optimize = false;

        for (var i = 0; i < chart.data.datasets.length; i++)
            can_optimize |= chart.data.datasets[i].pv.optimized;

        // Shows a pleasant warning that the request is fetching optimized data
        if (can_optimize)
            ui.showWarning ();
        else
            ui.hideWarning ();
    }

    var improveData = function (data) {

        if (data.length > 0)  {

            var first = data[0],
                last  = data[data.length - 1];

            if (first.x.getTime() > start.getTime())
                data.unshift ({
                    x : start,
                    y : first.y
                });

            if (last.x.getTime() < end.getTime())
                data.push ({
                    x : end,
                    y : last.y
                });
        }

        return data;
    }

    /**
    * Updates a plot of index pv_index.
    **/
    async function updatePlot(pv_index) {
	// If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
        if (chart.data.datasets[pv_index].data.length == 0) {

            //var bins = shouldOptimizeRequest(chart.data.datasets[pv_index].pv.samplingPeriod, chart.data.datasets[pv_index].pv.type);
            //chart.data.datasets[pv_index].pv.optimized = bins < 0 ? false : true;

            var bins = chartUtils.timeAxisPreferences[window_time].bins;

            var fetchedData = await archInterface.fetchData (chart.data.datasets[pv_index].label, start, end, chart.data.datasets[pv_index].pv.optimized, bins, handlers.handleFetchDataError,
		 ui.enableLoading);

            if (fetchedData && fetchedData.length > 0)
                Array.prototype.push.apply(chart.data.datasets[pv_index].data, improveData (archInterface.parseData(fetchedData[0].data)));
        }
        else {

            // Gets the time of the first and last element of the dataset
            var first = chart.data.datasets[pv_index].data[0].x,
                last  = chart.data.datasets[pv_index].data[chart.data.datasets[pv_index].data.length - 1].x;

            //chart.data.datasets[pv_index].pv.optimized = false;

            // we need to append data to the beginning of the data set
            if (first.getTime() > start.getTime()) {

                // Fetches data from the start to the first measure's time
                var appendData = await archInterface.fetchData(chart.data.datasets[pv_index].label, start, first, false, handlers.handleFetchDataError, ui.enableLoading);

                // Appends new data into the dataset
                if (appendData.length > 0) {

                    appendData = appendData[0].data;

                    var x = new Date(appendData[appendData.length - 1].secs * 1e3 + appendData[appendData.length - 1].nanos * 1e-6);

                    // Verifies if we are not appending redundant data into the dataset
                    while (appendData.length > 0 && x.getTime() >= first.getTime()) {

                        appendData.pop(); // remove last element, which is already in the dataset

                        if (appendData.length > 0)
                            x.setUTCMilliseconds(appendData[appendData.length - 1].secs * 1e3 + appendData[appendData.length - 1].nanos * 1e-6);
                    }

                    Array.prototype.unshift.apply(chart.data.datasets[pv_index].data, archInterface.parseData(appendData));
                }
            }
            // We can remove unnecessary data from the beginning of the dataset to save memory and improve performance
            else {
                while (chart.data.datasets[pv_index].data.length > 0 && chart.data.datasets[pv_index].data[0].x.getTime() < start.getTime())
                    chart.data.datasets[pv_index].data.shift();
            }

            // we need to append data to the end of the data set
            if (last.getTime() < end.getTime()) {

                // Fetches data from the last measure's time to the end
                var appendData = await archInterface.fetchData(chart.data.datasets[pv_index].label, last, end, false, handlers.handleFetchDataError, ui.enableLoading);

                // Appends new data into the dataset
                if (appendData.length > 0) {

                    appendData = appendData[0].data;

                    var x = new Date(appendData[0].secs * 1e3 + appendData[0].nanos * 1e-6);

                    // Verifies if we are not appending redundant data into the dataset
                    while (appendData.length > 0 && x.getTime() <= last.getTime()) {

                        appendData.shift();

                        if (appendData.length > 0)
                            x.setUTCMilliseconds(appendData[0].secs * 1e3 + appendData[0].nanos * 1e-6);
                    }

                    Array.prototype.push.apply(chart.data.datasets[pv_index].data, archInterface.parseData(appendData));
                }
            }
            // We can remove unnecessary data from the end of the dataset to save memory and improve performance
            else {
                var i = chart.data.datasets[pv_index].data.length - 1;

                for (var i = chart.data.datasets[pv_index].data.length - 1;
                     chart.data.datasets[pv_index].data.length > 0 && chart.data.datasets[pv_index].data[i].x.getTime() > end.getTime();
                     i--)
                    chart.data.datasets[pv_index].data.pop();

            }

            await improveData(chart.data.datasets[pv_index].data);
        }

        updateOptimizedWarning();
    }

    var optimizeAllGraphs = function () {
        for (var i = 0; i < chart.data.datasets.length; i++) {
            var bins = shouldOptimizeRequest(chart.data.datasets[i].pv.samplingPeriod, chart.data.datasets[i].pv.type);
            chart.data.datasets[i].pv.optimized = bins < 0 ? false : true;
        }
    }

    /**
    * Updates all plots added so far. Resets informs if the user wants to reset the data in the dataset.
    **/
    async function updateAllPlots(reset) {
	if (reset == undefined)
            reset = false;

        for (var i = 0; i < chart.data.datasets.length; i++) {

            if (chart.data.datasets[i].pv.optimized || reset)
                chart.data.datasets[i].data.length = 0;

            await updatePlot(i);
        }

	ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);
	await chart.update();
	ui.disableLoading();
    };

    /**
    * Checks if a PV is already plotted.
    **/
    var getPlotIndex = function (pv_name) {

        // Iterates over the dataset to check if a pv named pv_name exists
        for (var i = 0; i < chart.data.datasets.length; i++)
            if (chart.data.datasets[i].label == pv_name || chart.data.datasets[i].label == decodeURIComponent(pv_name))
                return i;

        return null;
    }

    var updateURL = function () {

        var searchString = "?";

        for (var i = 0; i < chart.data.datasets.length; i++) {
            if (chart.data.datasets[i].pv.optimized)
                searchString += "pv=optimized_" + chartUtils.timeAxisPreferences[window_time].bins + "(" + encodeURIComponent (chart.data.datasets[i].label) + ")&";
            else
                searchString += "pv=" + encodeURIComponent (chart.data.datasets[i].label) + "&";
        }

        searchString += "from=" + encodeURIComponent (start.toJSON()) + "&";
        searchString += "to=" + encodeURIComponent (end.toJSON());

        ui.updateAddress (searchString);

    };

    async function loadFromURL(searchPath) {

        var pvs = [], urlStart = null, urlEnd = null;

        if (searchPath != "") {

            var search_paths = searchPath.split('&');

            for (var i = 0; i < search_paths.length; i++){

                if (search_paths[i].indexOf("pv=") != -1)
                    pvs.push (decodeURIComponent(search_paths[i].substr(search_paths[i].indexOf("=") + 1)));
                else if (search_paths[i].indexOf("from=") != -1)
                    urlStart = decodeURIComponent(search_paths[i].substr(search_paths[i].indexOf("=") + 1));
                else if (search_paths[i].indexOf("to=") != -1)
                    urlEnd = decodeURIComponent(search_paths[i].substr(search_paths[i].indexOf("=") + 1));
            }
        }

        if (urlStart != null && urlEnd != null) {

            start = new Date (urlStart);
            end = new Date (urlEnd);

            window_time = 0;
            while (end.getTime() - start.getTime() < chartUtils.timeAxisPreferences[window_time].milliseconds && window_time < chartUtils.timeIDs.SEG_30)
                window_time++;
        }
        else
            await updateStartAndEnd(new Date(), true);

        //ui.toogleWindowButton(window_time, undefined);

        ui.updateDateComponents(end);

        chartUtils.updateTimeAxis (chart, chartUtils.timeAxisPreferences[window_time].unit, chartUtils.timeAxisPreferences[window_time].unitStepSize, start, end);

        for (var i = 0; i < pvs.length; i++) {

            var optimized = false;

            if (pvs[i].indexOf ("optimized_") != -1) {
                pvs[i] = pvs[i].substr (pvs[i].indexOf ("(") + 1);
                pvs[i] = pvs[i].substr (0, pvs[i].indexOf (")"));
                optimized = true;
            }

            appendPV (pvs[i], optimized);
        }

	var singleTipCookie = getCookie("singleTip");

	singleTip_enabled = singleTipCookie == 'true' || singleTipCookie == null;
	
	chartUtils.toggleTooltipBehavior(chart, singleTip_enabled);
	$(".fa-list").css("color", singleTip_enabled ? "lightgrey" : "black"); //addClass does not work in a predictable way

	chart.update(0, false);
    };

    function getCookie(name) {
        var cookieArr = document.cookie.split(";");
    
        for(var i = 0; i < cookieArr.length; i++) {
            var cookiePair = cookieArr[i].split("=");
            if(name == cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
    
        return null;
    }

    async function getDateNow() {
    if(!serverDate_enabled){return new Date();}
        Promise.resolve( $.ajax ({
            url: "http://10.0.105.37/date",
	    timeout: 100
        })
        ).then(function(e) {
		return new Date(e.data);
        })
        .catch(function(e) {
                serverDate_enabled = false;
		console.log('Date retrieval has failed. Will use local date for remainder of session.');
                return new Date();
        });
    }


    var optimizePlot = function (datasetIndex, optimize) {
        chart.data.datasets[datasetIndex].pv.optimized = optimize;
        
        chart.data.datasets[datasetIndex].data.length = 0;

        updatePlot (datasetIndex);

        chart.update();

        ui.disableLoading ();
        updateURL ();
    };

    var removeDataset = function (datasetIndex, undo) {

        chartUtils.yAxisUseCounter () [chart.data.datasets[datasetIndex].yAxisID]--;
        chartUtils.colorStack ().push (chart.data.datasets[datasetIndex].backgroundColor);

        if (!undo || undo == undefined)
            undo_stack.push({action : STACK_ACTIONS.REMOVE_PV, pv : chart.data.datasets[datasetIndex].label, optimized : chart.data.datasets[datasetIndex].pv.optimized});

        if (chartUtils.yAxisUseCounter () [chart.data.datasets[datasetIndex].yAxisID] == 0) {
            delete chartUtils.yAxisUseCounter () [chart.data.datasets[datasetIndex].yAxisID];
            chart.scales[chart.data.datasets[datasetIndex].yAxisID].options.display = false;
            chartUtils.updateAxisPositionLeft (chart.scales[chart.data.datasets[datasetIndex].yAxisID].position == "left");
            delete chart.scales[chart.data.datasets[datasetIndex].yAxisID];
	    for(var i = 1; i < chart.options.scales.yAxes.length; i++)
	    {
		if(chart.options.scales.yAxes[i].id == chart.data.datasets[datasetIndex].yAxisID)
		{
			chart.options.scales.yAxes.splice (i, 1);
			break;
		}
	    }
        }

	chart.data.datasets.splice (datasetIndex, 1);
        chart.update(0);
        updateURL ();
        ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);
        updateOptimizedWarning();
    };

    var hideAxis = function (event) {
        chartUtils.hidesAxis (chart.getDatasetMeta (event.data.datasetIndex), chart);
        chart.update(0, false);
    };

    var optimizeHandler = function (event) {
        optimizePlot (event.data.datasetIndex, this.checked);
    };

    var handleDataAxisInfoTableUpdate = ()=>{
        ui.updateDataAxisInfoTable(
            chartUtils.getAxesInUse(chart.options.scales.yAxes),
            (evt)=>{chartUtils.toggleAxisType(chart, evt.data.axisId, evt.target.checked);},
            (evt)=>{chartUtils.toggleAutoY(chart, evt.data.axisId, evt.currentTarget);},
	    (evt)=>{chartUtils.changeYLimit(chart, evt.data.axisId, evt.currentTarget);},
	);
    }

    var removeHandler = function (event) {
        removeDataset(event.data.datasetIndex);
        handleDataAxisInfoTableUpdate();
    };

    return {

        /* const references */
        stackActions: STACK_ACTIONS,
        references: REFERENCE,

        /* Getters */
        chart: function () { return chart; },
        start: function () { return start; },
        end: function () { return end; },
        reference : function () { return reference; },
        window_time: function () { return window_time; },
        timer: function () { return timer; },
        auto_enabled: function () { return auto_enabled; },
	singleTip_enabled: function () { return singleTip_enabled; },
        scrolling_enabled: function () { return scrolling_enabled; },
	serverDate_enabled: function () { return serverDate_enabled; },
        drag_flags: function () { return drag_flags; },
        zoom_flags: function () { return zoom_flags; },
        undo_stack: function () { return undo_stack; },
        redo_stack: function () { return redo_stack; },

        getWindowTime: function(){return window_time},

        /* Setters */
        startTimer : function (t) { timer = t; },

        updateTimeWindow : updateTimeWindow,
        updateTimeWindowOnly : function (t) { window_time = t; },
        updateStartTime : function (s) { start = s; },
        updateEndTime : function (e) { end = e; },
        updateTimeReference : function (r) { reference = r; },
        updateStartAndEnd: updateStartAndEnd,

        toggleAuto : function () { auto_enabled = !auto_enabled; },
	toggleSingleTip: function () { singleTip_enabled = !singleTip_enabled },
        disableAuto : function () { auto_enabled = false; },
	disableServerDate : function () { serverDate_enabled = false; },
        enableAuto : function () { auto_enabled = true; },

        disableScrolling : function () { scrolling_enabled = false; },
        enableScrolling : function () { scrolling_enabled = true; },

        startDrag: function () { drag_flags.drag_started = true; },
        stopDrag: function () { drag_flags.drag_started = false; },
        updateDragEndTime : function (t) { drag_flags.end_time = t; },
        updateDragOffsetX : function (x) { drag_flags.x = x; },

        enableZoom: function () { zoom_flags.isZooming = true; },
        disableZoom: function () { zoom_flags.isZooming = false;  },

        init: init,
        appendPV: appendPV,
        shouldOptimizeRequest: shouldOptimizeRequest,
        updateOptimizedWarning: updateOptimizedWarning,
        improveData: improveData,
        updatePlot: updatePlot,
        optimizeAllGraphs: optimizeAllGraphs,
        updateAllPlots: updateAllPlots,
        getPlotIndex: getPlotIndex,
        updateURL: updateURL,
        loadFromURL: loadFromURL,
        optimizePlot: optimizePlot,
	removeDataset: removeDataset,
        hideAxis: hideAxis,
        optimizeHandler: optimizeHandler,
        removeHandler: removeHandler,
    };

})();
