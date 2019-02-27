/******* Time window control functions *******/
/**
* The following functions control the start and end time that will be plotted on the graph.
* end stands for the most recent time, meanwhile start
* stands for the beginning of the window time.
**/
/* require archInterface, chartUtils */

/* Module dependencies */
var ui = require ("./ui.js");
var chartUtils = require ("./chartUtils.js");
var archInterface = require ("./archInterface.js");

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

    var scrolling_enabled = true;

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

    var updateTimeWindow = function (window) {

        ui.toogleWindowButton (window, window_time);

        window_time = window;

        if (window_time < chartUtils.timeIDs.MIN_30) {

            if (auto_enabled) {

                auto_enabled = false;

                clearInterval(timer);

                ui.enableDate();
                ui.enable ($("#date span.now"));
                ui.enable ($("#date span.zoom"));
                ui.enable ($("#date span.forward"));
                ui.enable ($("#date span.backward"));

                $("#date img").css({"cursor" : "pointer"});
            }

            ui.disable ($("#date span.auto"));
        }
        else if (!auto_enabled)
            ui.enable ($("#date span.auto"));

        ui.enableLoading();

        if (reference == REFERENCE.END)
            start = new Date(end.getTime() - chartUtils.timeAxisPreferences[window_time].milliseconds);

        else if (reference == REFERENCE.START) {

            var now = new Date ();

            if (start.getTime() + chartUtils.timeAxisPreferences[window_time].milliseconds <= now.getTime())
                end = new Date(start.getTime() + chartUtils.timeAxisPreferences[window_time].milliseconds);
            else end = now;
        }

        optimizeAllGraphs ();

        updateAllPlots(true);

        updateURL();

        chartUtils.updateTimeAxis (chart, chartUtils.timeAxisPreferences[window_time].unit, chartUtils.timeAxisPreferences[window_time].unitStepSize, start, end);

        chart.update(0, false);

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
    var appendPV = function (pv, optimized, undo) {

        if (chartUtils.colorStack ().length == 0) {
            ui.toogleSearchWarning ("Maximum plotted PV number has already been reached.");
            return;
        }

        // Asks for the PV's metadata
        var metadata = archInterface.fetchMetadata(pv);
        var bins = shouldOptimizeRequest(parseFloat(metadata["samplingPeriod"]), metadata["DBRType"]);

        if (optimized == false)
            bins = -1;
        else if (optimized && bins == -1)
            bins = chartUtils.timeAxisPreferences[window_time].bins;

        var data = archInterface.fetchData(pv, start, end, bins < 0 ? false : true, bins);
        if (data == undefined || data == null || data[0].data.length == 0)
            ui.toogleSearchWarning ("No data was received from server.");
        else{
            chartUtils.appendDataset(chart, improveData(archInterface.parseData(data[0].data)), bins, parseInt(data[0].meta.PREC) + 1, metadata);
        }

        updateOptimizedWarning();
        updateURL();

        ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);

        if (!undo || undo == undefined)
            undo_stack.push ({action : STACK_ACTIONS.APPEND_PV, pv : pv});
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
    var updateStartAndEnd = function (date, updateHtml, undo) {

        if (updateHtml == undefined || updateHtml == null)
            updateHtml = false;

        var now = new Date();

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
    var updatePlot = function (pv_index) {

        // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
        if (chart.data.datasets[pv_index].data.length == 0) {

            //var bins = shouldOptimizeRequest(chart.data.datasets[pv_index].pv.samplingPeriod, chart.data.datasets[pv_index].pv.type);
            //chart.data.datasets[pv_index].pv.optimized = bins < 0 ? false : true;

            var bins = chartUtils.timeAxisPreferences[window_time].bins;

            var fetchedData = archInterface.fetchData (chart.data.datasets[pv_index].label, start, end, chart.data.datasets[pv_index].pv.optimized, bins);

            if (fetchedData.length > 0)
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
                var appendData = archInterface.fetchData(chart.data.datasets[pv_index].label, start, first, false);

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
                var appendData = archInterface.fetchData(chart.data.datasets[pv_index].label, last, end, false);

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

            improveData(chart.data.datasets[pv_index].data);
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
    var updateAllPlots = function (reset) {

        if (reset == undefined)
            reset = false;

        for (var i = 0; i < chart.data.datasets.length; i++) {

            if (chart.data.datasets[i].pv.optimized || reset)
                chart.data.datasets[i].data.length = 0;

            updatePlot(i);
        }

        ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);
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

    var loadFromURL = function (searchPath) {

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
            updateStartAndEnd (new Date (), true);

        ui.toogleWindowButton (window_time, undefined);

        ui.updateDateComponents (end);

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

        chart.update(0, false);
    };

    var optimizePlot = function (datasetIndex, optimize) {

        chart.data.datasets[datasetIndex].pv.optimized = optimize;

        ui.enableLoading ();

        chart.data.datasets[datasetIndex].data.length = 0;

        updatePlot (datasetIndex);

        chart.update (0, false);

        ui.disableLoading ();

        updateURL ();
    };

    var removeDataset = function (datasetIndex, undo) {

        chartUtils.yAxisUseCounter () [chart.data.datasets[datasetIndex].yAxisID]--;

        chartUtils.colorStack ().push (chart.data.datasets[datasetIndex].backgroundColor);

        if (!undo || undo == undefined)
            undo_stack.push ({action : STACK_ACTIONS.REMOVE_PV, pv : chart.data.datasets[datasetIndex].label, optimized : chart.data.datasets[datasetIndex].pv.optimized});

        if (chartUtils.yAxisUseCounter () [chart.data.datasets[datasetIndex].yAxisID] == 0) {

            delete chartUtils.yAxisUseCounter () [chart.data.datasets[datasetIndex].yAxisID];

            chart.scales[chart.data.datasets[datasetIndex].yAxisID].options.display = false;

            chartUtils.updateAxisPositionLeft (chart.scales[chart.data.datasets[datasetIndex].yAxisID].position == "left");

            delete chart.scales[chart.data.datasets[datasetIndex].yAxisID];
        }

        chart.data.datasets.splice (datasetIndex, 1);

        chart.update (0, false);

        updateURL ();

        ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);

        updateOptimizedWarning ();
    };

    var hideAxis = function (event) {

        chartUtils.hidesAxis (chart.getDatasetMeta (event.data.datasetIndex), chart);
        chart.update (0, false);
    };

    var optimizeHandler = function (event) {

        optimizePlot (event.data.datasetIndex, this.checked);
    };

    var removeHandler = function (event) {

        removeDataset (event.data.datasetIndex);
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
        scrolling_enabled: function () { return scrolling_enabled; },
        drag_flags: function () { return drag_flags; },
        zoom_flags: function () { return zoom_flags; },
        undo_stack: function () { return undo_stack; },
        redo_stack: function () { return redo_stack; },

        /* Setters */
        startTimer : function (t) { timer = t; },

        updateTimeWindow : updateTimeWindow,
        updateTimeWindowOnly : function (t) { window_time = t; },
        updateStartTime : function (s) { start = s; },
        updateEndTime : function (e) { end = e; },
        updateTimeReference : function (r) { reference = r; },
        updateStartAndEnd: updateStartAndEnd,

        toggleAuto : function () { auto_enabled = !auto_enabled; },
        disableAuto : function () { auto_enabled = false; },
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
