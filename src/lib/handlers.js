import {utils as XLSXutils, write as XLSXwrite} from 'xlsx';
import { saveAs as FileSaverSaveAs} from 'file-saver';

var ui = require ("./ui.js");
var chartUtils = require ("./chartUtils.js");
var archInterface = require ("./archInterface.js");
var control = require ("./control.js");

module.exports = (function () {

    const KEY_ENTER = 13;
    const REFRESH_INTERVAL = 1;

    /**
    * Updates the chart after a date is chosen by the user.
    **/
    async function onChangeDateHandler(date) {

        //var new_date = ui.getTimedate();
        var new_date = date;
        
        await control.updateStartAndEnd(new_date, true);

        control.updateAllPlots(true);
        control.updateURL();

        chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

        control.chart ().update(0, false);
    }

    /**
    * updateTimeWindow is called when a button event in one of the time window options is captured.
    * Sets control.start () accoording to this new time window and updates the Chartjs
    * by calling plot-related functions.
    * Chooses whether the next request for the archiver will be optimized (to reduce the big amount of data) or raw.
    **/
    var updateTimeWindow = function (timeId) {
        control.undo_stack().push({action : control.stackActions.CHANGE_WINDOW_TIME, window : control.window_time()});
        control.updateTimeWindow(timeId);
    };

    /**
    * Updates control.end () to the present instant and redraws all plots
    **/
    async function updateEndNow(button) {

        if (!control.auto_enabled ()) {
            if (control.reference () == control.references.START) {

                control.updateTimeReference (control.references.END);
                ui.enableReference(control.references.END);
            }

	    var now = await control.getDateNow();

            await control.updateStartAndEnd(now, true);

            chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

            control.updateAllPlots(true);
            control.updateURL();

            control.chart ().update(0, false);
        }
    }

    /**
    * Sets control.end () to control.start () and redraws all plots. In other
    * other words, it regresses the time window size into the past.
    **/
    async function backTimeWindow(button) {

        if (!control.auto_enabled ()) {
            var date = control.start ();
            if (control.reference () == control.references.END)
                date = control.end ();

            await control.updateStartAndEnd(new Date(date.getTime() - chartUtils.timeAxisPreferences[control.window_time ()].milliseconds), true);

            chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

            control.updateAllPlots(true);
            control.updateURL();

            control.chart ().update(0, false);
        }
    }

    /**
    * Sets control.start () to control.end () and redraws all plots.
    **/
    async function forwTimeWindow(button) {

        if (!control.auto_enabled ()) {
            var date = control.start ();
            if (control.reference () == control.references.END)
                date = control.end ();

            await control.updateStartAndEnd(new Date(date.getTime() + chartUtils.timeAxisPreferences[control.window_time ()].milliseconds), true);

            chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

            control.updateAllPlots(true);
            control.updateURL();

            control.chart ().update(0, false);

            ui.disableLoading();
        }
    }


    var handleQueryBefore = ()=>{ ui.enableLoading() }
    var handleQuerySuccess = (data, statusText) =>{
        let pv_list = [];
        data.forEach(element => {
           if(element.status=='Being archived'){
            pv_list.push(element['pvName']);
           }
        });
        ui.showSearchResults(pv_list, appendPVHandler);
    }
    var handleQueryError = (data, statusText, errorThrown) =>{
        ui.toogleSearchWarning("An error occured on the server while disconnected PVs -- " + statusText + " -- " + errorThrown);
    }
    var handleQueryComplete = (data)=>{ ui.disableLoading() }
    async function queryPVs(e, val) {
        if (e.which == KEY_ENTER) {
            await archInterface.getPVStatus(val,
                handleQuerySuccess, handleQueryError,
                handleQueryComplete, handleQueryBefore);
        }
    }

    var handleFetchDataError = (xmlHttpRequest, textStatus, errorThrown)=>{
        ui.toogleSearchWarning ("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
    }

    /**
    * Event handler which is called when the user clicks over a PV to append it
    **/
    var appendPVHandler = function (e) {

        var pv = e.target.innerText;
        var pv_index = control.getPlotIndex(pv);

        if (pv_index == null)
            control.appendPV(pv);
        else
            control.updatePlot(pv_index);

        control.chart ().update(0, false);

        ui.hideSearchedPVs();
    }

    var plotSelectedPVs = function (e) {
        var pvs = ui.selectedPVs ();
        for (var i = 0; i < pvs.length; i++) { 
            var pv_index = control.getPlotIndex(pvs [i]);
            if (pv_index == null){
                control.appendPV(pvs [i]);
            }
            else{
                control.updatePlot (pv_index);
            }
        }

        ui.hideSearchedPVs();
        control.chart ().update(0, false);
        control.updateOptimizedWarning ();
    }

    /******* Scrolling function *******/
    /**
    * The following function manages mouse wheel events in the canvas area
    **/

    var scrollChart = function (evt) {
        if (control.scrolling_enabled ()) {
            ui.enableLoading();
            control.disableScrolling ();
            var window_time_new = evt.deltaY > 0 ? Math.max(control.window_time () - 1, 0) : Math.min(control.window_time () + 1, chartUtils.timeIDs.SEG_30);
            if (window_time_new != control.window_time ()){
                control.updateTimeWindow(window_time_new);
            }
            ui.disableLoading();
            control.enableScrolling();
        }
    };

    function singleTipHandler(e) {
	$(".fa-list").css("color", control.singleTip_enabled() ? "black" : "lightgrey");
	
	control.toggleSingleTip();
	document.cookie = 'singleTip='+control.singleTip_enabled()+'; SameSite=Strict'; // Concatenation necessary to fix issues with the web VPN
	chartUtils.toggleTooltipBehavior(control.chart(), control.singleTip_enabled());
    }

    function closestDateValue(searchDate, dates) {
	if(searchDate - dates[0] <= 0){
	       return 0;
	} else if (searchDate - dates[dates.length-1] >= 0){
	       return dates.length-1;
	}

	let i;
	
	for(i = 0; i < dates.length;i++){
	    if(searchDate - dates[i] < 0){ 
		return i-1;
	    } else if (searchDate == dates[i]) {
		return i;
	    }
	}
    };

    var tooltipColorHandler = function(tooltip) {
	                if(tooltip.dataPoints != undefined && !control.singleTip_enabled()){
                        var i;
			tooltip.labelColors = [];
		        tooltip.labelTextColors = [];
                        for(i = 0; i < tooltip.dataPoints.length; i++){
                                if(tooltip.dataPoints[i] !== undefined){
                                        tooltip.labelColors.push({
                                            backgroundColor: tooltip.dataPoints[i].backgroundColor || '#fff',
                                            borderColor: tooltip.dataPoints[i].borderColor || '#fff'
                                        });
					tooltip.labelTextColors.push('#fff');
				}
                            }
                        }
                };

    /*
    * Handles tooltip item list correction and addition
    */
    var bodyCallback = function(labels, chart) {
	if(control.singleTip_enabled() || labels[0] === undefined ){return;}
        var drawnDatasets = labels.map(x => x.datasetIndex);
        var masterSet = labels[0].datasetIndex;
        var stringDate = labels[0].xLabel.substring(0,23);

        labels[0].backgroundColor = chart.datasets[masterSet].backgroundColor;
        labels[0].borderColor = chart.datasets[masterSet].borderColor;

        var masterDate = new Date(stringDate);
        var index = 1;

        for (var i = 0; i < chart.datasets.length; i++)
        {
            if(i != masterSet)
            {
                var closest = closestDateValue(masterDate, chart.datasets[i].data.map(x => x.x));

                if(chart.datasets[i].data[closest] === undefined || chart.datasets[i].data[closest] === undefined){
                    return "Loading datasets...";
                }
                if(drawnDatasets.includes(i)){
                    labels[index].yLabel = chart.datasets[i].data[closest].y;
                    labels[index].x = labels[0].x;
                    labels[index].y = chart.datasets[i].data[closest].y;
                    labels[index].backgroundColor = chart.datasets[i].backgroundColor;
                    labels[index].borderColor = chart.datasets[i].borderColor;
                    index++;
                } else {
                    labels.push({datasetIndex: i,
                    index: closest,
                    label: chart.datasets[i].data[closest].x.toString(),
                    value: chart.datasets[i].data[closest].y.toString(),
                    x: labels[0].x,
                    xLabel: labels[0].xLabel,
                    y: labels[0].y,
                    yLabel: chart.datasets[i].data[closest].y*1,
                    backgroundColor: chart.datasets[i].backgroundColor || '#fff',
                    borderColor: chart.datasets[i].borderColor || '#fff'});          
                }
            }
        }

            labels.sort(function(a,b) {
                return a.datasetIndex - b.datasetIndex;
            });

            //labels.splice(masterSet+1, 0, labels[0]);
            //labels.shift();
        };



    /**
    * Enables or disables plot auto refreshing.
    **/
    async function autoRefreshingHandler(e) {

        if (control.auto_enabled ()) {

            $(this).css("background-color", "grey");

            clearInterval(control.timer ());

            ui.enableDate();
            ui.enable ($("#date span.now"));
            ui.enable ($("#date span.zoom"));
            ui.enable ($("#date span.forward"));
            ui.enable ($("#date span.backward"));

            $("#date img").css({"cursor" : "pointer"});

        }
        else {

            control.startTimer (setInterval(async function () {
                if (control.reference () == control.references.START) {
                    control.updateTimeReference (control.references.END);
                    ui.enableReference(control.references.END);
                }

		var now = await control.getDateNow();

                await control.updateStartAndEnd(now, true, true);

                chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

                control.updateAllPlots(true);

                control.updateURL();

                control.chart ().update(0, false);
            }, REFRESH_INTERVAL * 1000));

            $(this).css('background-color',"lightgrey");

            ui.disableDate();
            ui.disable ($("#date span.now"));
            ui.disable ($("#date span.zoom"));
            ui.disable ($("#date span.forward"));
            ui.disable ($("#date span.backward"));

            $("#date img").css ({"cursor" : "not-allowed"});
        }

        control.toggleAuto ();
    };

    /**
    * Updates the plot after the user clicks on a point.
    **/
    async function dataClickHandler(evt) {

        if (!control.drag_flags ().drag_started && !control.auto_enabled ()) {

            var event = control.chart ().getElementsAtEvent(evt);

            if (event != undefined && event.length > 0) {

                var event_data = control.chart ().data.datasets[event[0]._datasetIndex].data[event[0]._index].x;
                var middle_data = new Date(event_data.getTime() + chartUtils.timeAxisPreferences[control.window_time ()].milliseconds / 2);

                await control.updateStartAndEnd(middle_data, true);

                chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

                control.updateAllPlots(true);

                control.updateURL();

                control.chart ().update(0, false);
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

        control.startDrag ();
	
	control.updateDragOffsetX (evt.offsetX);

        control.updateDragEndTime (control.end ());

        if (control.zoom_flags().isZooming) {

            control.zoom_flags().begin_x = evt.clientX;
            control.zoom_flags().begin_y = evt.clientY;

            control.zoom_flags().hasBegan = true;

            $("#canvas_area span.selection_box").css("display", "block");

            // Computes zoom initial time
            control.zoom_flags().time_1 = new Date(control.start ().getTime() + evt.offsetX * chartUtils.timeAxisPreferences[control.window_time ()].milliseconds / control.chart ().chart.width );
        }
    }

    /**
    * Handles a dragging event in the chart and updates the chart drawing area.
    **/
    async function doDragging(evt) {
        if (!control.zoom_flags().isZooming && !control.auto_enabled () && control.drag_flags ().drag_started) {

            var offset_x = control.drag_flags ().x - evt.offsetX;
            var new_date = new Date(control.end ().getTime() + offset_x * chartUtils.timeAxisPreferences[control.window_time ()].milliseconds / control.chart ().chart.width );

            if (control.reference () == control.references.START)
                new_date = new Date(control.start ().getTime() + offset_x * chartUtils.timeAxisPreferences[control.window_time ()].milliseconds / control.chart ().chart.width );

            control.updateDragOffsetX (evt.offsetX);

            await control.updateStartAndEnd (new_date, true, true);

            chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

            if (!control.drag_flags ().updateOnComplete) {

                control.updateAllPlots(true);
                control.updateURL();
            }

            control.chart ().update(0, false);
        }

        // Draws zoom rectangle indicating the area in which this operation will applied
        if (control.zoom_flags().isZooming && control.zoom_flags().hasBegan) {

            // x,y,w,h = o retângulo entre os vértices
            var x = Math.min(control.zoom_flags().begin_x, evt.clientX);
            var w = Math.abs(control.zoom_flags().begin_x - evt.clientX);

            ui.drawZoomBox (x, w, control.chart ().chart.height);
        }
     }

    /**
    * Finishes dragging and applies zoom on the chart if this action was previously selected.
    **/
    async function stopDragging(evt) {

        if (control.drag_flags ().drag_started && control.drag_flags ().updateOnComplete) {
            control.updateAllPlots(true);
            control.updateURL();
            control.chart ().update(0, false);

            control.undo_stack().push ({action: control.stackActions.CHANGE_END_TIME, end_time: control.drag_flags ().end_time});
        }

        // Finishes zoom and updates the chart
        if (control.zoom_flags().isZooming && control.zoom_flags().hasBegan) {
            control.zoom_flags().time_2 = new Date (control.start ().getTime() + evt.offsetX * chartUtils.timeAxisPreferences[control.window_time ()].milliseconds / control.chart ().chart.width);

            if (control.zoom_flags().time_1 != undefined && control.zoom_flags().time_2 != undefined) {

                control.undo_stack().push ({action: control.stackActions.ZOOM, start_time : control.start (), end_time : control.end (), window_time : control.window_time ()});

                // Checks which zoom times should be used as start time or end time
                if (control.zoom_flags().time_1.getTime() < control.zoom_flags().time_2.getTime()) {

                    await control.updateStartTime (control.zoom_flags().time_1);
                    control.updateEndTime (control.zoom_flags().time_2);
                }
                else {

                    await control.updateStartTime (control.zoom_flags().time_2);
                    control.updateEndTime (control.zoom_flags().time_1);
                }

                // Chooses the x axis time scale
                var i = 0;
                while (control.end ().getTime() - control.start ().getTime() < chartUtils.timeAxisPreferences[i].milliseconds && i < chartUtils.timeIDs.SEG_30)
                    i++;

                //ui.toogleWindowButton (undefined, control.window_time ());

                control.updateTimeWindowOnly (i);

                ui.hideZoomBox ();

                chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[i].unit, chartUtils.timeAxisPreferences[i].unitStepSize, control.start (), control.end ());

                control.optimizeAllGraphs ();
                control.updateAllPlots(true);
                control.updateURL();

                ui.updateDateComponents (control.reference () == control.references.END ? control.end () : control.start ());

                // Redraws the chart
                control.chart ().update(0, false);

                control.updateOptimizedWarning();

                ui.toggleZoomButton (false);
             }
        }

        control.stopDrag ();
        control.zoom_flags().hasBegan = false;
        control.disableZoom ();
    }

    /**
    * Adjusts the global variables to perform a zoom in the chart.
    **/
    var zoomClickHandler = function (event) {

        if (!control.auto_enabled ()) {

            if (control.zoom_flags().isZooming)
                control.disableZoom ();
            else
                control.enableZoom ();

            ui.toggleZoomButton (control.zoom_flags().isZooming);
        }
    };

    /**
    * Shows or erases data table below the chart
    **/
    var toogleTable = function (evt) {

        if (this.checked) {
            ui.updateDataTable (control.chart ().data.datasets, control.start (), control.end ());
            ui.showTable ();
        }
        else
            ui.resetTable ();
    };

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
        if (control.auto_enabled ())
            return undefined;

        let book = XLSXutils.book_new(), sheets = [];

        let sheetInfo = [];
        for (var i = 0; i < control.chart ().data.datasets.length; i++) {
            let dataset = control.chart ().data.datasets[i];
            let pvName = dataset.label;
            let metadata = dataset.pv.metadata;

            var data_array = control.chart ().data.datasets[i].data.map (function(data) {
                  return {
                    x: data.x.toLocaleString("br-BR") + '.' + data.x.getMilliseconds(),
                    y: data.y,
                  };
            });

            let sheetName = pvName.replace(new RegExp(':', 'g'), '_');
            if(sheetName.length > 31){
                sheetName = (i + 1).toString();
            }
            sheetInfo.push({
                'Sheet Name': sheetName,
                'PV Name': pvName,
                ...metadata
            });
            XLSXutils.book_append_sheet(book, XLSXutils.json_to_sheet(data_array), sheetName);
        }

        // Sheet containing PV information.
        XLSXutils.book_append_sheet(book, XLSXutils.json_to_sheet(sheetInfo), 'Sheet Info');

        // Write the stuff
        var wbout = XLSXwrite(book, {bookType:t, type: 'binary'});
        try {
	        FileSaverSaveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'export.' + t);
        } catch(e) { if(typeof console != 'undefined') console.log(e, wbout); }

        return wbout;
    };

    async function undoHandler() {
        if (control.undo_stack().length > 0 && !control.auto_enabled ()) {

            var undo = control.undo_stack().pop ();

            switch (undo.action) {

                case control.stackActions.REMOVE_PV:

                    control.redo_stack().push ({action : control.stackActions.REMOVE_PV, pv : undo.pv});
                    control.appendPV (undo.pv, undo.optimized, true);
                    break;

                case control.stackActions.APPEND_PV:

                    var index = control.getPlotIndex (undo.pv);

                    control.redo_stack().push ({action : control.stackActions.APPEND_PV, pv : undo.pv, optimized : control.chart ().data.datasets[index].pv.optimized});
                    control.removeDataset (index, true);
                    break;

                case control.stackActions.CHANGE_WINDOW_TIME:

                    control.redo_stack().push ({action : control.stackActions.CHANGE_WINDOW_TIME, window : control.window_time ()});
                    control.updateTimeWindow (undo.window);
                    break;

                case control.stackActions.CHANGE_END_TIME:

                    control.redo_stack().push ({action : control.stackActions.CHANGE_END_TIME, end_time : control.end ()});

                    control.updateTimeReference (control.references.END);

                    await control.updateStartAndEnd(undo.end_time, true, true);

                    // does not change the time window, only updates all plots
                    control.updateTimeWindow (control.window_time ());

                    break;

                case control.stackActions.CHANGE_START_TIME:

                    control.redo_stack().push ({action : control.stackActions.CHANGE_START_TIME, start_time : control.start ()});

                    control.updateTimeReference (control.references.START);

                    await control.updateStartAndEnd(undo.start_time, true, true);

                    // does not change the time window, only updates all plots
                    control.updateTimeWindow (control.window_time ());

                    break;

                case control.stackActions.ZOOM:

                    control.redo_stack().push ({action : control.stackActions.ZOOM, start_time: control.start (), end_time : control.end (), window_time: control.window_time ()});

                    await control.updateStartAndEnd(undo.end_time, true, true);

                    control.updateTimeWindow (undo.window_time);

                    control.chart ().update(0, false);

                    break;
            }

            control.chart ().update (0, false);
        }
    };

    async function redoHandler() {

        if (control.redo_stack().length > 0 && !control.auto_enabled ()) {

            var redo = control.redo_stack().pop ();

            switch (redo.action) {

                case control.stackActions.REMOVE_PV:

                    control.removeDataset (control.getPlotIndex (redo.pv));
                    break;

                case control.stackActions.APPEND_PV:

                    control.appendPV (redo.pv, redo.optimized);
                    break;

                case control.stackActions.CHANGE_WINDOW_TIME:

                    control.updateTimeWindow (redo.window);
                    break;

                case control.stackActions.CHANGE_START_TIME:

                    ui.enableLoading();

                    control.updateTimeReference (control.references.START);

                    await control.updateStartAndEnd(redo.start_time, true);
                    control.updateAllPlots(true);
                    control.updateURL();

                    chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

                    control.chart ().update(0, false);

                    ui.disableLoading();

                    break;

                case control.stackActions.CHANGE_END_TIME:

                    ui.enableLoading();

                    control.updateTimeReference (control.references.END);

                    await control.updateStartAndEnd(redo.end_time, true);
                    control.updateAllPlots(true);
                    control.updateURL();

                    chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[control.window_time ()].unit, chartUtils.timeAxisPreferences[control.window_time ()].unitStepSize, control.start (), control.end ());

                    control.chart ().update(0, false);

                    ui.disableLoading();

                    break;

                case control.stackActions.ZOOM:

                    //ui.toogleWindowButton (undefined, control.window_time ());

                    // Updates the chart attributes
                    await control.updateStartTime (redo.start_time);
                    control.updateEndTime (redo.end_time);

                    chartUtils.updateTimeAxis (control.chart (), chartUtils.timeAxisPreferences[redo.window_time].unit, chartUtils.timeAxisPreferences[redo.window_time].unitStepSize, control.start (), control.end ());

                    control.optimizeAllGraphs ();
                    control.updateAllPlots(true);
                    control.updateURL();

                    ui.updateDateComponents (control.end ());

                    // Redraws the chart
                    control.chart ().update(0, false);

                    control.updateOptimizedWarning();

                    break;
            }

            control.chart ().update (0, false);

        }
    };

    var updateReferenceTime = function (isEndSelected) {
        if (isEndSelected) {
            ui.updateDateComponents (control.end ());
            control.updateTimeReference (control.references.END);
        }
        else {
            ui.updateDateComponents (control.start ());
            control.updateTimeReference (control.references.START);
        }
    };

    return {
        handleFetchDataError:handleFetchDataError,

	bodyCallback: bodyCallback,
	tooltipColorHandler: tooltipColorHandler,

        onChangeDateHandler : onChangeDateHandler,
        updateTimeWindow: updateTimeWindow,
        updateEndNow: updateEndNow,
        backTimeWindow: backTimeWindow,
        forwTimeWindow: forwTimeWindow,
        queryPVs: queryPVs,
        appendPVHandler: appendPVHandler,
        plotSelectedPVs: plotSelectedPVs,
        scrollChart: scrollChart,
        autoRefreshingHandler: autoRefreshingHandler,
        singleTipHandler: singleTipHandler,
	dataClickHandler: dataClickHandler,

        startDragging: startDragging,
        doDragging: doDragging,
        stopDragging: stopDragging,
        zoomClickHandler: zoomClickHandler,

        toogleTable: toogleTable,
        exportAs: exportAs,
        undoHandler: undoHandler,
        redoHandler: redoHandler,
        updateReferenceTime: updateReferenceTime,
    };

})();
