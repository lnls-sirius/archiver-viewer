
var handlers = (function () {

    const KEY_ENTER = 13;
    const REFRESH_INTERVAL = 1;

    /**
    * Updates the chart after a date is chosen by the user.
    **/
    var onChangeDateHandler = function (date) {

        var new_date = ui.getTimedate();

        ui.enableLoading();

        control.updateEnd(new_date, true);

        control.updateAllPlots(true);
        control.updateURL();

        chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

        control.chart.update(0, false);

        ui.disableLoading();
    }

    /**
    * updateTimeWindow is called when a button event in one of the time window options is captured.
    * Sets control.start accoording to this new time window and updates the Chartjs
    * by calling plot-related functions. Chooses whether the next request for the archiver will be optimized
    * (to reduce the big amount of data) or raw.
    **/
    var updateTimeWindow = function (button) {

        if (button.target.className == "unpushed") {

            ui.toogleWindowButton (button.target.cellIndex, control.window_time);

            control.window_time = button.target.cellIndex;

            ui.enableLoading();

            control.start = new Date(control.end.getTime() - chartUtils.timeAxisPreferences[control.window_time].milliseconds);

            control.optimizeAllGraphs ();

            control.updateAllPlots(true);
            control.updateURL();

            chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

            control.chart.update(0, false);

            ui.disableLoading();

            /*
            if (document.getElementsByClassName('enable_table')[0].checked) {
                control.updateDataTable();
                $('#data_table_area .data_table').show();
            }
            */
        }
    };

    /**
    * Updates control.end to the present instant and redraws all plots
    **/
    var updateEndNow = function (button) {

        if (!control.auto_enabled) {

            ui.enableLoading();

            control.updateEnd(new Date(), true);

            chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

            control.updateAllPlots(true);
            control.updateURL();

            control.chart.update(0, false);

            ui.disableLoading();
        }
    }

    /**
    * Sets control.end to control.start and redraws all plots. In other
    * other words, it regresses the time window size into the past.
    **/
    var backTimeWindow = function (button) {

        if (!control.auto_enabled) {

            ui.enableLoading();

            control.updateEnd(new Date(control.end.getTime() - chartUtils.timeAxisPreferences[control.window_time].milliseconds), true);

            chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

            control.updateAllPlots(true);
            control.updateURL();

            control.chart.update(0, false);

            ui.disableLoading();
        }
    }

    /**
    * Sets control.start to control.end and redraws all plots.
    **/
    var forwTimeWindow = function (button) {

        if (!control.auto_enabled) {

            ui.enableLoading();

            control.updateEnd(new Date(control.end.getTime() + chartUtils.timeAxisPreferences[control.window_time].milliseconds), true);

            chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

            control.updateAllPlots(true);
            control.updateURL();

            control.chart.update(0, false);

            ui.disableLoading();
        }
    }

    /**
    * Key event handler which looks for PVs in the archiver
    **/
    var queryPVs = function (key) {

        if (key.which == KEY_ENTER) {
            ui.enableLoading ();
            ui.showSearchResults (archInterface.query ($('#PV').val()));
            ui.disableLoading ();
        }
    }

    /**
    * Closes PV selection area.
    **/
    var refreshScreen = ui.refreshScreen;

    /**
    * Event handler which is called when the user clicks over a PV to append it
    **/
    var appendPVHandler = function (e) {

        var pv = e.target.innerText,
            pv_index = control.getPlotIndex(pv);

        if (pv_index == null)
            control.appendPV(pv);
        else
            control.updatePlot(pv_index);

        control.chart.update(0, false);

        ui.hideSearchedPVs();
    }

    /******* Scrolling function *******/
    /**
    * The following function manages mouse wheel events in the canvas area
    **/

    var scrollChart = function (evt) {

        if (control.scrolling_enabled) {

            ui.enableLoading();

            control.scrolling_enabled = false;

            var window_time_old = control.window_time;

            control.window_time = evt.deltaY < 0 ? Math.max(control.window_time - 1, 0) : Math.min(control.window_time + 1, chartUtils.timeIDs.SEG_30);

            if (window_time_old != control.window_time) {

                ui.toogleWindowButton (control.window_time, window_time_old);

                control.start = new Date(control.end.getTime() - chartUtils.timeAxisPreferences[control.window_time].milliseconds);

                control.updateAllPlots(true);

                control.updateURL();

                chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

                control.chart.update(0, false);

            }

            ui.disableLoading();

            control.scrolling_enabled = true;
        }
    };

    /**
    * Enables or disables plot auto refreshing.
    **/
    var autoRefreshingHandler = function (e) {

        if (control.auto_enabled) {

            $(this).css('background-color',"white");

            control.auto_enabled = false;

            clearInterval(control.timer);

            ui.disableDate();

        }
        else {

            control.timer = setInterval(function () {

                ui.enableLoading();

                control.updateEnd(new Date(), true);

                chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

                control.updateAllPlots();

                control.updateURL();

                control.chart.update(0, false);

                ui.disableLoading();

            }, REFRESH_INTERVAL * 1000);

            $(this).css('background-color',"lightgrey");

            control.auto_enabled = true;

            ui.enableDate();
        }
    };

    /**
    * Updates the plot after the user clicks on a point.
    **/
    var dataClickHandler = function (evt) {

        if (!control.drag_flags.drag_started && !control.auto_enabled) {

            var event = control.chart.getElementsAtEvent(evt);

            if (event != undefined && event.length > 0) {

                var event_data = control.chart.data.datasets[event[0]._datasetIndex].data[event[0]._index].x,
                    middle_data = new Date(event_data.getTime() + chartUtils.timeAxisPreferences[control.window_time].milliseconds / 2);

                ui.enableLoading();

                control.updateEnd(middle_data, true);

                chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

                control.updateAllPlots(true);

                control.updateURL();

                control.chart.update(0, false);

                ui.disableLoading();
            }
        }
    };

    /******* Dragging and zoom functions *******/
    /**
    * The following functions manage the dragging and zoom operations in the chart.
    **/

    /**
    * Handles a mouse click event in the chart and prepares for zooming or dragging.
    **/
    var startDragging = function (evt) {

        control.drag_flags.drag_started = true;

        control.drag_flags.x = evt.offsetX;

        if (control.zoom_flags.isZooming) {

            control.zoom_flags.begin_x = evt.clientX;
            control.zoom_flags.begin_y = evt.clientY;

            control.zoom_flags.hasBegan = true;

            $("#canvas_area span.selection_box").css("display", "block");

            // Computes zoom initial time
            control.zoom_flags.time_1 = new Date(control.start.getTime() + evt.offsetX * chartUtils.timeAxisPreferences[control.window_time].milliseconds / control.chart.chart.width );
        }
    }

    /**
    * Handles a dragging event in the chart and updates the chart drawing area.
    **/
    var doDragging = function (evt) {

        if (!control.zoom_flags.isZooming && !control.auto_enabled && control.drag_flags.drag_started) {

            var offset_x = control.drag_flags.x - evt.offsetX,
                new_date = new Date(control.end.getTime() + offset_x * chartUtils.timeAxisPreferences[control.window_time].milliseconds / control.chart.chart.width );

            control.drag_flags.x = evt.offsetX;

            control.updateEnd(new_date, true);

            chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

            if (!control.drag_flags.updateOnComplete)
                control.updateAllPlots(true);

            control.chart.update(0, false);
        }

        // Draws zoom rectangle indicating the area in which this operation will applied
        if (control.zoom_flags.isZooming && control.zoom_flags.hasBegan) {

            // x,y,w,h = o retângulo entre os vértices
            var x = Math.min(control.zoom_flags.begin_x, evt.clientX);
            var w = Math.abs(control.zoom_flags.begin_x - evt.clientX);

            ui.drawZoomBox (x, w, control.chart.chart.height);
        }
     }

    /**
    * Finishes dragging and applies zoom on the chart if this action was previously selected.
    **/
    var stopDragging = function (evt) {

        if (control.drag_flags.drag_started && control.drag_flags.updateOnComplete) {

            ui.enableLoading ();

            control.updateAllPlots(true);
            control.updateURL();
            control.chart.update(0, false);

            ui.disableLoading ();
        }

        // Finishes zoom and updates the chart
        if (control.zoom_flags.isZooming && control.zoom_flags.hasBegan) {

            ui.enableLoading ();

            control.zoom_flags.time_2 = new Date (control.start.getTime() + evt.offsetX * chartUtils.timeAxisPreferences[control.window_time].milliseconds / control.chart.chart.width);

            if (control.zoom_flags.time_1 != undefined && control.zoom_flags.time_2 != undefined) {

                // Checks which zoom times should be used as start time or end time
                if (control.zoom_flags.time_1.getTime() < control.zoom_flags.time_2.getTime()) {

                    control.start = control.zoom_flags.time_1;
                    control.end   = control.zoom_flags.time_2;
                }
                else {
                    control.start = control.zoom_flags.time_2;
                    control.end   = control.zoom_flags.time_1;
                }

                // Chooses the x axis time scale
                var i = 0;
                while (control.end.getTime() - control.start.getTime() < chartUtils.timeAxisPreferences[i].milliseconds && i < chartUtils.timeIDs.SEG_30)
                    i++;

                ui.toogleWindowButton (undefined, control.window_time);

                ui.hideZoomBox ();

                // Updates the chart attributes
                control.window_time = i;

                chartUtils.updateTimeAxis (control.chart, chartUtils.timeAxisPreferences[control.window_time].unit, chartUtils.timeAxisPreferences[control.window_time].unitStepSize, control.start, control.end);

                control.optimizeAllGraphs ();
                control.updateAllPlots(true);
                control.updateURL();

                ui.updateDateComponents (control.end);

                // Redraws the chart
                control.chart.update(0, false);

                control.updateOptimizedWarning();

                ui.toggleZoomButton (false);
                ui.disableLoading ();
            }
        }

        control.drag_flags.drag_started = false;
        control.zoom_flags.hasBegan = false;
        control.zoom_flags.isZooming = false;
    }

    /**
    * Adjusts the global variables to perform a zoom in the chart.
    **/
    var zoomClickHandler = function (event) {

        if (!control.auto_enabled) {

            control.zoom_flags.isZooming = !control.zoom_flags.isZooming;

            ui.toggleZoomButton (control.zoom_flags.isZooming);
        }
    };

    /**
    * Shows or erases data table below the chart
    **/
    var toogleTable = function (evt) {

        if (this.checked) {
            ui.updateDataTable (control.chart.data.datasets, control.start, control.end);
            ui.showTable ();
        }
        else 
            ui.resetTable ();
    }

    function s2ab(s) {
	    if(typeof ArrayBuffer !== 'undefined') {
		    var buf = new ArrayBuffer(s.length);
		    var view = new Uint8Array(buf);
		    for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
		    return buf;
	    } else {
		    var buf = new Array(s.length);
		    for (var i=0; i!=s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
		    return buf;
	    }
    }

    var exportAs = function (t) {

        var book = XLSX.utils.book_new(), sheets = [];

        for (var i = 0; i < control.chart.data.datasets.length; i++)
            XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet (control.chart.data.datasets[i].data, {cellDates: true, dateNF: "dd/mm/yy h:mm:ss"}), control.chart.data.datasets[i].label.replace(new RegExp(':', 'g'), '_'));

        var wbout = XLSX.write(book, {bookType:t, type: 'binary'});

        try {
	        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'export.' + t);
        } catch(e) { if(typeof console != 'undefined') console.log(e, wbout); }

        return wbout;      
    }

    return {

        onChangeDateHandler : onChangeDateHandler,
        updateTimeWindow: updateTimeWindow,
        updateEndNow: updateEndNow,
        backTimeWindow: backTimeWindow,
        forwTimeWindow: forwTimeWindow,
        queryPVs: queryPVs,
        refreshScreen: refreshScreen,
        appendPVHandler: appendPVHandler,
        scrollChart: scrollChart,
        autoRefreshingHandler: autoRefreshingHandler,
        dataClickHandler: dataClickHandler,

        startDragging: startDragging,
        doDragging: doDragging,
        stopDragging: stopDragging,
        zoomClickHandler: zoomClickHandler,

        toogleTable: toogleTable,
        exportAs: exportAs,
    };

}) ();
