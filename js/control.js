/******* Time window control functions *******/
/**
* The following functions control the start and end time that will be plotted on the graph.
* control.end stands for the most recent time, meanwhile control.start
* stands for the beginning of the window time.
**/
/* require archInterface, chartUtils */

var control = (function () {

    const DATA_VOLUME_MAX = 5000;

    /* chartjs instance reference */
    var chart = null;

    /* start and end timedates */
    var start, end;

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

    /**
    * Appends a new variable into the chart.
    **/
    var appendPV = function (pv, optimized) {

        // Asks for the PV's metadata in order to retrieve its unit, type and samping period
        var metadata = archInterface.fetchMetadata(pv),
            unit = metadata["EGU"] != "" || metadata["EGU"] == undefined ? metadata["EGU"] : pv;

        var bins = control.shouldOptimizeRequest(parseFloat(metadata["samplingPeriod"]), metadata["DBRType"]);

        if (optimized == false)
            bins = -1;
        else if (bins == -1)        
            bins = chartUtils.timeAxisPreferences[control.window_time].bins;

        var data = archInterface.fetchData(pv, control.start, control.end, bins < 0 ? false : true, bins);

        //control.chart.data.datasets[pv_index].pv.optimized = bins < 0 ? false : true;

        if (data == undefined || data == null || data[0].data.length == 0)
            alert("No data was received from server.");
        else
            chartUtils.appendDataset (control.chart, data[0].meta.name, archInterface.parseData(data[0].data, bins < 0 ? false : true), parseFloat(metadata["samplingPeriod"]), metadata["DBRType"], unit, bins, parseInt(data[0].meta.PREC) + 1);

        control.updateOptimizedWarning();

        control.updateURL();

        ui.updatePVInfoTable(control.chart.data.datasets);
    }

    /**
    * Checks if the request must optimized because of the variable's data volume. It returns -1 if no optimization is required or the number of bins otherwise.
    **/
    var shouldOptimizeRequest = function (samplingPeriod, type) {

        if (type == "DBR_SCALAR_ENUM")
            return -1;

        /*
        var dataEstimative = chartUtils.timeAxisPreferences[control.window_time].milliseconds / (1000 * samplingPeriod);

        if (dataEstimative > DATA_VOLUME_MAX)
            return chartUtils.timeAxisPreferences[control.window_time].bins;
        */

        if (control.window_time < chartUtils.timeIDs.HOUR_2)
            return chartUtils.timeAxisPreferences[control.window_time].bins;

        return -1;
    }

    /******* Update functions *******/
    /**
    * The following functions updates the data plotted by the chart. They are called by
    * the event handlers mostly.
    **/

    /**
    * Sets control.end to date and updates control.start according
    * to the time window size. Updates HTML elements in the case updateHtml is true.
    **/
    var updateEnd = function (date, updateHtml) {

        if (updateHtml == undefined || updateHtml == null)
            updateHtml = false;

        var now = new Date();

        if (date.getTime() <= now.getTime())
            control.end = date;
        else control.end = now;

        control.start = new Date(control.end.getTime() - chartUtils.timeAxisPreferences[control.window_time].milliseconds);

        if (updateHtml) 
            ui.updateDateComponents (control.end);
    };

    var updateOptimizedWarning = function () {

        var can_optimize = false;

        for (var i = 0; i < control.chart.data.datasets.length; i++)
            can_optimize |= control.chart.data.datasets[i].pv.optimized;

        // Shows a pleasant warning that the request is fetching optimized data
        if (can_optimize)
            ui.showWarning ();
        else
            ui.hideWarning ();
    }

    /**
    * Updates a plot of index pv_index.
    **/
    var updatePlot = function (pv_index) {

        // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
        if (control.chart.data.datasets[pv_index].data.length == 0) {

            //var bins = control.shouldOptimizeRequest(control.chart.data.datasets[pv_index].pv.samplingPeriod, control.chart.data.datasets[pv_index].pv.type);
            //control.chart.data.datasets[pv_index].pv.optimized = bins < 0 ? false : true;

            var bins = chartUtils.timeAxisPreferences[control.window_time].bins;

            var fetchedData = archInterface.fetchData (control.chart.data.datasets[pv_index].label, control.start, control.end, control.chart.data.datasets[pv_index].pv.optimized, bins);

            if (fetchedData.length > 0) {

                fetchedData = fetchedData[0].data;

                Array.prototype.push.apply(control.chart.data.datasets[pv_index].data, archInterface.parseData(fetchedData, control.chart.data.datasets[pv_index].pv.optimized));
            }
        }
        else {

            // Gets the time of the first and last element of the dataset
            var first = control.chart.data.datasets[pv_index].data[0].x,
                last  = control.chart.data.datasets[pv_index].data[control.chart.data.datasets[pv_index].data.length - 1].x;

            //control.chart.data.datasets[pv_index].pv.optimized = false;

            // we need to append data to the beginning of the data set
            if (first.getTime() > control.start.getTime()) {

                // Fetches data from the control.start to the first measure's time
                var appendData = archInterface.fetchData(control.chart.data.datasets[pv_index].label, control.start, first, false);

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

                    Array.prototype.unshift.apply(control.chart.data.datasets[pv_index].data, archInterface.parseData(appendData, false));
                }
            }
            // We can remove unnecessary data from the beginning of the dataset to save memory and improve performance
            else {
                while (control.chart.data.datasets[pv_index].data.length > 0 && control.chart.data.datasets[pv_index].data[0].x.getTime() < control.start.getTime())
                    control.chart.data.datasets[pv_index].data.shift();
            }

            // we need to append data to the end of the data set
            if (last.getTime() < control.end.getTime()) {

                // Fetches data from the last measure's time to the control.end
                var appendData = archInterface.fetchData(control.chart.data.datasets[pv_index].label, last, control.end, false);

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

                    Array.prototype.push.apply(control.chart.data.datasets[pv_index].data, archInterface.parseData(appendData, false));
                }
            }
            // We can remove unnecessary data from the end of the dataset to save memory and improve performance
            else {
                var i = control.chart.data.datasets[pv_index].data.length - 1;

                for (var i = control.chart.data.datasets[pv_index].data.length - 1;
                     control.chart.data.datasets[pv_index].data.length > 0 && control.chart.data.datasets[pv_index].data[i].x.getTime() > control.end.getTime();
                     i--)
                    control.chart.data.datasets[pv_index].data.pop();

            }
        }

        control.updateOptimizedWarning();
    }

    var optimizeAllGraphs = function () {

        for (var i = 0; i < control.chart.data.datasets.length; i++) {
            var bins = control.shouldOptimizeRequest(control.chart.data.datasets[i].pv.samplingPeriod, control.chart.data.datasets[i].pv.type);
            control.chart.data.datasets[i].pv.optimized = bins < 0 ? false : true;
        }
    }

    /**
    * Updates all plots added so far. Resets informs if the user wants to reset the data in the dataset.
    **/
    var updateAllPlots = function (reset) {

        if (reset == undefined)
            reset = false;

        for (var i = 0; i < control.chart.data.datasets.length; i++) {

            if (control.chart.data.datasets[i].pv.optimized || reset)
                control.chart.data.datasets[i].data.length = 0;

            control.updatePlot(i);
        }

        ui.updatePVInfoTable(control.chart.data.datasets);
    };

    /**
    * Checks if a PV is already plotted.
    **/
    var getPlotIndex = function (pv_name) {

        // Iterates over the dataset to check if a pv named pv_name exists
        for (var i = 0; i < control.chart.data.datasets.length; i++)
            if (control.chart.data.datasets[i].label == pv_name)
                return i;
        return null;
    }

    var updateURL = function () {

        var searchString = "?";

        for (var i = 0; i < control.chart.data.datasets.length; i++) {
            if (control.chart.data.datasets[i].pv.optimized)
                searchString += "pv=optimized_" + chartUtils.timeAxisPreferences[control.window_time].bins + "(" + encodeURIComponent (control.chart.data.datasets[i].label) + ")&";
            else 
                searchString += "pv=" + encodeURIComponent (control.chart.data.datasets[i].label) + "&";
        }

        searchString += "from=" + encodeURIComponent (control.start.toJSON()) + "&";
        searchString += "to=" + encodeURIComponent (control.end.toJSON());

        ui.updateAddress (searchString);

    };

    var loadFromURL = function (searchPath) {

        var pvs = [], start = null, end = null;

        if (searchPath != "") {

            var search_paths = searchPath.split('&');

            for (var i = 0; i < search_paths.length; i++){

                if (search_paths[i].indexOf("pv=") != -1)
                    pvs.push (search_paths[i].substr(search_paths[i].indexOf("=") + 1));
                else if (search_paths[i].indexOf("from=") != -1)
                    start = decodeURIComponent(search_paths[i].substr(search_paths[i].indexOf("=") + 1));
                else if (search_paths[i].indexOf("to=") != -1)
                    end = decodeURIComponent(search_paths[i].substr(search_paths[i].indexOf("=") + 1));
            }
        }

        if (start != null && end != null) {

            control.start = new Date (start);
            control.end = new Date (end);

            control.window_time = 0;
            while (control.end.getTime() - control.start.getTime() < chartUtils.timeAxisPreferences[control.window_time].milliseconds && control.window_time < chartUtils.timeIDs.SEG_30)
                control.window_time++;
        }
        else
            control.updateEnd (new Date (), true);

        ui.toogleWindowButton (control.window_time, undefined);

        ui.updateDateComponents (control.end);

        chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

        for (var i = 0; i < pvs.length; i++) {
 
            var optimized = false;

            if (pvs[i].indexOf ("optimized_") != -1) {
                pvs[i] = pvs[i].substr (pvs[i].indexOf ("(") + 1);
                pvs[i] = pvs[i].substr (0, pvs[i].indexOf (")"));
                optimized = true;
            }

            control.appendPV (pvs[i], optimized);
        }

        control.chart.update(0, false);
    };

    var optimizePlot = function (datasetIndex, optimize) {

        control.chart.data.datasets[datasetIndex].pv.optimized = optimize;

        ui.enableLoading ();

        control.chart.data.datasets[datasetIndex].data.length = 0;

        control.updatePlot (datasetIndex);

        control.chart.update (0, false);

        ui.disableLoading ();

        control.updateURL ();
    }

    return {

        chart: chart,
        start: start,
        end: end,
        window_time: window_time,
        timer: timer,
        auto_enabled: auto_enabled,
        scrolling_enabled: scrolling_enabled,
        drag_flags: drag_flags,
        zoom_flags: zoom_flags,

        appendPV: appendPV,
        updateEnd: updateEnd,
        shouldOptimizeRequest: shouldOptimizeRequest,
        updateOptimizedWarning: updateOptimizedWarning,
        updatePlot: updatePlot,
        optimizeAllGraphs: optimizeAllGraphs,
        updateAllPlots: updateAllPlots,
        getPlotIndex: getPlotIndex,
        updateURL: updateURL,
        loadFromURL: loadFromURL,
        optimizePlot: optimizePlot,
    };

})();
