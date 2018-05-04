/***
* A web viewer application based on Chartjs for the EPICS archiver.
*
* Gustavo Ciotto Pinton
* LNLS - Brazilian Synchrotron Laboratory
***/

/* Module dependencies */
var $ = require('jquery-browserify');
require('jquery-mousewheel')($);

var Chart = require ('chart.js');

var ui = require ("./lib/ui.js");
var chartUtils = require ("./lib/chartUtils.js");
var archInterface = require ("./lib/archInterface.js");
var control = require ("./lib/control.js");
var handlers = require ("./lib/handlers.js");

/* Registers event handler functions */

$(document).click(handlers.refreshScreen);

$("#window_size table tr td").on("click", handlers.updateTimeWindow);

$("#date").on('change', 'input', handlers.onChangeDateHandler);
$("#date .now").on("click", handlers.updateEndNow);
$("#date .backward").on("click", handlers.backTimeWindow);
$("#date .forward").on("click", handlers.forwTimeWindow);
$("#date .zoom").on("click", handlers.zoomClickHandler);
$("#date .auto").on("click", handlers.autoRefreshingHandler);
$("#date .type").on("change", handlers.updateReferenceTime);

$('#data_table_area .enable_table:checkbox').change(handlers.toogleTable);
$("#undo").on("click", handlers.undoHandler);
$("#redo").on("click", handlers.redoHandler);

$('#PV').keypress(handlers.queryPVs);

$("#archiver_viewer").on('click', handlers.dataClickHandler);
$("#archiver_viewer").mousewheel(handlers.scrollChart);

$("#plotSelected").on('click', handlers.plotSelectedPVs);
$("#selectAll").on('click', ui.selectedAllPVs);
$("#deselectAll").on('click', ui.deselectedAllPVs);

// Binds handlers to the dragging events
$("#archiver_viewer").mousedown(handlers.startDragging);
$("#archiver_viewer").mousemove(handlers.doDragging);
$("#archiver_viewer").mouseup(handlers.stopDragging);

$("#xlsx").click ({"type" : "xlsx"}, function (event) {
    handlers.exportAs(event.data.type);
});

$("#ods").click ({"type" : "ods"}, function (event) {
    handlers.exportAs(event.data.type);
});

$("#csv").click ({"type" : "csv"}, function (event) {
    handlers.exportAs(event.data.type);
});

$("#print").click (function (event) {
    handlers.printCanvas(document.getElementById("archiver_viewer"));
});

/******* Initialization function *******/
/**
* Instantiates a new chart and global structures
**/
$(document).ready(function () {

    control.init (new Chart($("#archiver_viewer"), {

        type: 'line',
        data: [],
        options: {

            animation: {
                duration: 0,
            },

            tooltips: {
                mode: 'nearest',
                intersect: false,
                cornerRadius: 15,

                callbacks: {
                    label: chartUtils.labelCallback,
                },
            },

            hover: {
                mode: 'nearest',
                intersect: false,
                animationDuration: 0,
            },

            title: {
                display: true,
            },

            scales: {
                xAxes: [{
                    // Common x axis
                    id: chartUtils.timeAxisID,
                    type: 'time',
                    time: {
                        unit: 'minute',
                        unitStepSize: 10,
                        displayFormats: {
                            minute: 'HH:mm'
                        }
                    },
                    ticks: {
                        autoSkip : true,
                        autoSkipPadding: 5,
                    }
                }],
                yAxes: [{
                    // Useless YAxis
                    type: "linear",
                    display: false,
                    position: "left",
                    id: "y-axis-0"
                }],
            },

            legend : {

                display: false,
                onClick : chartUtils.legendCallback,
            },

            maintainAspectRatio: false,
        }
    }));

    archInterface.updateURL(window.location.origin + window.location.pathname.substring(0, window.location.pathname.indexOf("/retrieval")));

    //document.getElementsByClassName('enable_table')[0].checked = false;

    $("#home").attr("href", archInterface.url().split(':')[0] + ":" + archInterface.url().split(':')[1]);

    ui.hideWarning ();

    ui.hideSearchWarning ();

    control.loadFromURL (window.location.search);
});
