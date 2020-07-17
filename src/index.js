/***
  A web viewer application based on Chartjs for the EPICS archiver.
 
  Gustavo Ciotto Pinton
  LNLS - Brazilian Synchrotron Laboratory
***/

import 'jquery-browserify';
import 'chart.js';

import * as chartUtils from './lib/chartUtils';
import * as handlers from './lib/handlers';
import * as control from './lib/control';
import * as archInterface from './lib/archInterface';
import * as ui from './lib/ui';

import './css/archiver.css';

import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";

ReactDOM.render(<App/>,document.getElementById("root"));
/* Registers event handler functions */
$("#archiver_viewer").on('click', handlers.dataClickHandler);
// Binds handlers to the dragging events
$("#archiver_viewer").mousedown(handlers.startDragging);
$("#archiver_viewer").mousemove(handlers.doDragging);
$("#archiver_viewer").mouseup(handlers.stopDragging);

$("#plotSelected").on('click', handlers.plotSelectedPVs);
$("#selectAll").on('click', ui.selectedAllPVs);
$("#deselectAll").on('click', ui.deselectedAllPVs);
$("#close").on('click', ui.hideSearchedPVs);


/******* Initialization function *******/
/**
* Instantiates a new chart and global structures
**/
$(document).ready(function () {
    let options = {
	    spanGaps: true,
            responsiveAnimationDuration: 0,
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            elements: {
                line:{
                    tension:0 // disable belzier curves
                }
            },
            tooltips: {
                mode: 'nearest',
                intersect: false,
                cornerRadius: 5,
                callbacks: { label: chartUtils.labelCallback },
            },
            hover: {
                mode: 'nearest',
                intersect: false,
                animationDuration: 0,
            },
            title: { display: false },
            scales: {
                xAxes: [{
                    // Common x axis
		    offset: true,
                    id: chartUtils.timeAxisID,
                    type: 'time',
                    distribution: 'linear',
                    time: {
                        unit: 'minute',
                        unitStepSize: 5,
                        displayFormats: {
                           	second: 'HH:mm:ss',
	    			minute: 'HH:mm',
				hour: 'HH:ss',
				day: 'MMM D hh:mm',
				month: 'MMM YYYY'
                        },
                        tooltipFormat: 'ddd MMM DD YYYY HH:mm:ss.SSS ZZ',
                    },
                    ticks: {
			source: "data",
                        autoSkip: true,
                        autoSkipPadding: 5,
			maxRotation: 0,
			minRotation: 0,
			stepSize: 1,
			maxTicksLimit: 15
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
            }
        };

    control.init (new Chart($("#archiver_viewer"), {
        type: 'line',
        data: [],
        options: options
    }));

    $("#home").attr("href", archInterface.url().split(':')[0] + ":" + archInterface.url().split(':')[1]);
    ui.hideWarning();
    ui.hideSearchWarning();

    control.loadFromURL(window.location.search);
});
