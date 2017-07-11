/***
* A web viewer application based on Chartjs for the EPICS archiver.
*
* Gustavo Ciotto Pinton
* LNLS - Brazilian Synchrotron Laboratory
***/


/******* Global application context *******/
var global_settings = {
	window_time : TIME_IDS.MIN_10,
	plotted_data: [],
	y_axis_ids: [],
	dragging : {
		isDragging : false,
	}
}

/******* Time window control functions *******/
/**
* The following functions control the start and end time that will be plotted on the graph.
* global_settings.end_time stands for the most recent time, meanwhile global_settings.start_time
* stands for the beginning of the window time.
**/

/**
* Sets global_settings.end_time to date and updates global_settings.start_time according
* to the time window size. Updates HTML elements in the case updateHtml is true.
**/
function setEndTime(date, updateHtml) {

	if (updateHtml == undefined || updateHtml == null)
		updateHtml = false;

	var now = new Date();

	if (date.getTime() <= now.getTime())
		global_settings.end_time = date;
	else 	global_settings.end_time = now;

	global_settings.start_time = new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds);

	if (updateHtml) {

	        $("#day").datepicker("setDate", date);
		$("#hour").val(pad_with_zeroes(date.getHours(), 2))
		$("#minute").val(pad_with_zeroes(date.getMinutes(), 2))
		$("#second").val(pad_with_zeroes(date.getSeconds(), 2))
	}
}

/**
* updateTimeWindow is called when a button event in one of the time window options is captured.
* Sets global_settings.start_time accoording to this new time window and updates the Chartjs
* by calling plot-related functions. Chooses whether the next request for the archiver will be optimized
* (to reduce the big amount of data) or raw.
**/
function updateTimeWindow(e) {

	if (e.target.className == "unpushed") {

		$('#window_table tr').eq(0).find('td').eq(global_settings.window_time)[0].className = "unpushed";

		e.target.className = "pushed";

		var i, can_optimize = false;
		for (i = 0; i < global_settings.plotted_data.length; i++) {
			global_settings.plotted_data[i].data.data.length = 0;
			if (global_settings.plotted_data[i].type != "DBR_SCALAR_ENUM")
				can_optimize = true;
		}

		// Shows a pleasant warning that the request is fetching optimized data
		if (TIME_AXIS_PREFERENCES[e.target.cellIndex].optimized && can_optimize)
			$("#obs").fadeIn();
        	else 	$("#obs").fadeOut();

		global_settings.window_time = e.target.cellIndex;

		$("#date .loading").show();

		global_settings.start_time = new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds);

		updateAllPlots();

		updateTimeScale(global_settings.window_time);

		global_settings.viewer.update(0, false);

		$("#date .loading").hide();

		if (document.getElementsByClassName('enable_table')[0].checked) {
			updateDataTable();
			$('#data_table_area .data_table').show();
		}
	}
}

/**
* Updates global_settings.end_time to the present instant and redraws all plots
**/
function updateEndTimeNow (e) {

	$("#date .loading").show();

	setEndTime(new Date(), true);

	updateTimeScale(global_settings.window_time);

	updateAllPlots();

	global_settings.viewer.update(0, false);

	$("#date .loading").hide();
}

/**
* Sets global_settings.end_time to global_settings.start_time and redraws all plots. In other
* other words, it regresses the time window size into the past.
**/
function backTimeWindow (e) {

	$("#date .loading").show();

	setEndTime(new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds), true);

	updateTimeScale(global_settings.window_time);

	updateAllPlots();

	global_settings.viewer.update(0, false);

	$("#date .loading").hide();
}

/**
* Sets global_settings.start_time to global_settings.end_time and redraws all plots.
**/
function forwTimeWindow (e) {

	$("#date .loading").show();

	setEndTime(new Date(global_settings.end_time.getTime() + TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds), true);

	updateTimeScale(global_settings.window_time);

	updateAllPlots();

	global_settings.viewer.update(0, false);

	$("#date .loading").hide();/**
* The following functions control which data will be written in table
* below the chart area. It dynamically draws and redraws this table.
**/
}

/* Binds functions to the events */
$("#window_size table tr td").on("click", updateTimeWindow);
$("#date .now").on("click", updateEndTimeNow);
$("#date .backward").on("click", backTimeWindow);
$("#date .forward").on("click", forwTimeWindow);

/******* Data table control functions *******/
/**
* The following functions control which data will be written in table
* below the chart area. It dynamically draws and redraws this table.
**/

/**
* updateDataTable draws a table below the char containing the data that is
* currently being rendered.
**/
function updateDataTable() {

	// Remove all data before rewriting
	$("#data_table_area .data_table").remove();
	$("#data_table_area h2").remove();

	// Draws a table for each variable chosen by the user
	for (var i = 0; i < global_settings.plotted_data.length; i++){

		var table = $('<table></table>').addClass('data_table'),
		    pv_data = global_settings.plotted_data[i].data.data,
		    count = 0;

		$('#data_table_area').append($('<h2></h2>').text(global_settings.plotted_data[i].pv));

		for (var j = 0; j < pv_data.length; j++) {

			var row;

			if ((pv_data[j].x.getTime() >= global_settings.start_time.getTime()) &&
				(pv_data[j].x.getTime() <= global_settings.end_time.getTime())) {

				if (!(count % PV_PER_ROW_DATA_TABLE)) {
					row = $("<tr></tr>")
					row.appendTo(table);
				}

				count++;

				$('<td></td>').attr('class', 'pv_time').text(pv_data[j].x.toLocaleDateString() + " " + pv_data[j].x.toLocaleTimeString()).appendTo(row);
				$('<td></td>').attr('class', 'pv_value').text(pv_data[j].y.toFixed(global_settings.plotted_data[i].precision)).appendTo(row);
			}
		}

		$('#data_table_area').append(table);
	}
}

/******* Fetching data functions *******/
/**
* The following functions communicate with the retrieval appliance and
* fetch data from the archiver.
**/

/**
* Gets the metadata associated with a PV.
**/
function getMetadataFromArchiver(pv) {

	if (pv == undefined)
		return null;

    	var 	jsonurl = ARCHIVER_URL + RETRIEVAL +'/bpl/getMetadata?pv=' + pv,
		components = jsonurl.split('?'),
		urlalone = components[0],
		querystring = components[1],
		HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
		return_data = null;

	$.ajax ({
		url: urlalone,
		data: querystring,
		type: HTTPMethod,
		dataType: 'json',
		async: false,
		success: function(data, textStatus, jqXHR) {
			if (textStatus == "success")
				return_data = data;
		},
		error: function(xmlHttpRequest, textStatus, errorThrown) {
			alert("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
		}
	});

	return return_data;
}

/**
* Requests data from the archiver.
**/
function requestDataFromArchiver(pv, from, to, optimized, bins) {

	if (from == undefined || to == undefined)
		return null;

	var 	jsonurl;

	if (optimized) {
		if (bins == undefined)
		    	bins = TIME_AXIS_PREFERENCES[global_settings.window_time].bins;

		jsonurl = ARCHIVER_URL + RETRIEVAL + '/data/getData.json?pv=optimized_' + bins + '(' + pv + ")&from=" + from.toJSON() + "&to=" + to.toJSON();
	}
	else jsonurl = ARCHIVER_URL + RETRIEVAL +'/data/getData.json?pv=' + pv + "&from=" + from.toJSON() + "&to=" + to.toJSON();

	var 	components = jsonurl.split('?'),
		urlalone = components[0],
		querystring = components[1],
		HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
		return_data = null;

	$.ajax ({
		url: urlalone,
		data: querystring,
		type: HTTPMethod,
		dataType: 'json',
		async: false,
		success: function(data, textStatus, jqXHR) {
			if (textStatus == "success")
				return_data = data;
		},
		error: function(xmlHttpRequest, textStatus, errorThrown) {
			alert("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
		}
	});

	return return_data;
}

/******* Chart control functions *******/
/**
* The following functions communicate with the retrieval appliance and
* fetch data from the archiver.
**/

function updateTimeScale(new_index) {

	global_settings.viewer.options.scales.xAxes[TIME_AXIS_INDEX].time.unit = TIME_AXIS_PREFERENCES[new_index].unit;
	global_settings.viewer.options.scales.xAxes[TIME_AXIS_INDEX].time.unitStepSize = TIME_AXIS_PREFERENCES[new_index].unitStepSize;

	global_settings.viewer.options.scales.xAxes[TIME_AXIS_INDEX].time.min = global_settings.start_time;
	global_settings.viewer.options.scales.xAxes[TIME_AXIS_INDEX].time.max = global_settings.end_time;
}

function addDataset(pv_data) {

	const pv_name = pv_data[0].meta.name;

	var all = parseData(pv_data[0].data, TIME_AXIS_PREFERENCES[global_settings.window_time].optimized);

	var 	meta = getMetadataFromArchiver(pv_name),
		color = "rgba(" + getRandomInt(0, 128) + "," + getRandomInt(0, 128) + "," + getRandomInt(0, 128) + ", 0.8)";

	var unit = meta["EGU"]

	addYAxis(unit, parseInt(pv_data[0].meta.PREC) + 1)

	var new_dataset = {

		label : pv_name,
		xAxisID: TIME_AXIS_ID,
		yAxisID: unit,
		data : all,
		showLine : true,
		steppedLine : true,
		fill : false,
		pointRadius : 0,
		backgroundColor : color,
		borderColor: color,
	};

	global_settings.plotted_data.push({
		pv : pv_name,
		data : new_dataset,
		precision: parseInt(pv_data[0].meta.PREC) + 1,
        	type: meta.DBRType,
	});

	global_settings.viewer.data.datasets.push(new_dataset);
}

function addYAxis(n_id, ticks_precision) {

//	if (global_settings.y_axis_ids.includes(n_id)) {
	if (n_id in global_settings.y_axis_ids) {

		global_settings.y_axis_ids[n_id]++;
		return ;
	}

	global_settings.y_axis_ids[n_id] = 1;

	var scaleOptions =  jQuery.extend(true, {}, SCALE_DEFAULTS);

	if (ticks_precision == undefined)
		ticks_precision = 3;

	scaleOptions.type = "linear";
	scaleOptions.position = "left";
	scaleOptions.id = n_id;

	scaleOptions.scaleLabel.display = true;
	scaleOptions.scaleLabel.labelString = n_id;

	scaleOptions.ticks.callback = function (value) {

		return value.toFixed(ticks_precision);
	};

	var scaleClass = Chart.scaleService.getScaleConstructor("linear");

	var n_scale = new scaleClass({
		id: n_id,
		options: scaleOptions,
		ctx: global_settings.viewer.chart.ctx,
		chart: global_settings.viewer
	});

	global_settings.viewer.scales[n_id] = n_scale;

	Chart.layoutService.addBox(global_settings.viewer, n_scale);

}

function isAlreadyPlotted(pv_name) {

	for (var i = 0; i < global_settings.plotted_data.length; i++)
		if (global_settings.plotted_data[i].pv == pv_name)
			return i;

	return null;
}

function updateAllPlots(reset) {

	if (reset == undefined)
		reset = false;

	var i;
	for (i = 0; i < global_settings.plotted_data.length; i++) {
		var optimize = global_settings.plotted_data[i].type == "DBR_SCALAR_ENUM" ? false : TIME_AXIS_PREFERENCES[global_settings.window_time].optimized;
		if (optimize || reset)
			global_settings.plotted_data[i].data.data.length = 0;
		updatePlot(i);
    	}

}

function parseData(data, optimized) {

	var r_data = [], i = 0;

	if (optimized == undefined)
		optimized = false;

	while(i < data.length) {

		var _x = new Date(data[i].secs * 1e3 + data[i].nanos * 1e-6);

		if (!isNaN( _x.getTime())) {

	            	var y_value = optimized ? data[i].val[0] : data[i].val;

			r_data.push({
				x : _x,
				y : y_value
			});
		}
		i++;
	}
	return r_data;
}

function updatePlot(pv_index) {

	if (global_settings.plotted_data[pv_index].data.data.length > 0) {

		var first = global_settings.plotted_data[pv_index].data.data[0].x;

		// we need to append data to the beginning of the data set
		if (first.getTime() > global_settings.start_time.getTime()) {

  			var optimize = global_settings.plotted_data[pv_index].type == "DBR_SCALAR_ENUM" ? false : TIME_AXIS_PREFERENCES[global_settings.window_time].optimized,
				bins = Math.round(TIME_AXIS_PREFERENCES[global_settings.window_time].bins * (first.getTime() - global_settings.start_time.getTime()) / TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds),
                new_data = requestDataFromArchiver(global_settings.plotted_data[pv_index].pv, global_settings.start_time, first, TIME_AXIS_PREFERENCES[global_settings.window_time].optimized, bins);

			if (new_data.length > 0) {

				new_data = new_data[0].data;
				var x = new Date(new_data[new_data.length - 1].secs * 1e3 + new_data[new_data.length - 1].nanos * 1e-6);
				while (new_data.length > 0 && x.getTime() >= first.getTime()) {
					new_data.pop(); // remove last element, which is already in the dataset
					if (new_data.length > 0)
						x.setUTCMilliseconds(new_data[new_data.length - 1].secs * 1e3 + new_data[new_data.length - 1].nanos * 1e-6);
				}

				Array.prototype.unshift.apply(global_settings.plotted_data[pv_index].data.data, parseData(new_data,  TIME_AXIS_PREFERENCES[global_settings.window_time].optimized));
			}
		}
		// we can remove unnecessary data to save memory and improve performance
		else {
			var i = 0;
			while ((global_settings.plotted_data[pv_index].data.data.length > SIZE_MIN) && (global_settings.plotted_data[pv_index].data.data[i].x.getTime() < global_settings.start_time.getTime() - TIME_OFFSET_ALLOWED))
				global_settings.plotted_data[pv_index].data.data.shift();
		}
	}

	if (global_settings.plotted_data[pv_index].data.data.length > 0) {

		last = global_settings.plotted_data[pv_index].data.data[global_settings.plotted_data[pv_index].data.data.length - 1].x;

		// we need to append data to the end of the data set
		if (last.getTime() < global_settings.end_time.getTime()) {

			var optimize = global_settings.plotted_data[pv_index].type == "DBR_SCALAR_ENUM" ? false : TIME_AXIS_PREFERENCES[global_settings.window_time].optimized,
				bins = Math.round(TIME_AXIS_PREFERENCES[global_settings.window_time].bins * (global_settings.end_time.getTime() - last.getTime()) / TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds),
                new_data = requestDataFromArchiver(global_settings.plotted_data[pv_index].pv, last, global_settings.end_time, TIME_AXIS_PREFERENCES[global_settings.window_time].optimized);

			if (new_data.length > 0) {
				new_data = new_data[0].data;
				var x = new Date(new_data[0].secs * 1e3 + new_data[0].nanos * 1e-6);
				while (new_data.length > 0 && x.getTime() <= last.getTime()) {
					new_data.shift();
					if (new_data.length > 0)
						x.setUTCMilliseconds(new_data[0].secs * 1e3 + new_data[0].nanos * 1e-6);
				}

				Array.prototype.push.apply(global_settings.plotted_data[pv_index].data.data, parseData(new_data, TIME_AXIS_PREFERENCES[global_settings.window_time].optimized));
			}
		}
		// we can remove unnecessary data to save memory and improve performance
		else {
			i = global_settings.plotted_data[pv_index].data.data.length - 1;
			while ((global_settings.plotted_data[pv_index].data.data.length > SIZE_MIN) && (global_settings.plotted_data[pv_index].data.data[i].x.getTime() > global_settings.end_time.getTime() + TIME_OFFSET_ALLOWED)) {
				global_settings.plotted_data[pv_index].data.data.pop();
				i--;
			}

		}
	}

	if (global_settings.plotted_data[pv_index].data.data.length == 0) {

		var optimize = global_settings.plotted_data[pv_index].type == "DBR_SCALAR_ENUM" ? false : TIME_AXIS_PREFERENCES[global_settings.window_time].optimized,
            new_data = requestDataFromArchiver(global_settings.plotted_data[pv_index].pv, global_settings.start_time,  global_settings.end_time, optimize)[0].data;
		Array.prototype.push.apply(global_settings.plotted_data[pv_index].data.data, parseData(new_data, optimize));
	}
}

function checkDataSize(pv_index) {

	var i;
	for (i = 0; i < global_settings.plotted_data[pv_index].data.data.length; i++) {
	    global_settings.plotted_data[pv_index].data.data.splice(i, TRIM_STEP);
	};
}

function addNewPV(pv) {

	var data = requestDataFromArchiver(pv, global_settings.start_time, global_settings.end_time, TIME_AXIS_PREFERENCES[global_settings.window_time].optimized);

	if (data == undefined || data == null || data[0].data.length == 0)
		alert("No data was received from server.");
	else
		addDataset(data);

}

function click_handler(e) {

	var 	pv = e.target.innerText,
		pv_index = isAlreadyPlotted(pv);

	if (pv_index == null)
		addNewPV(pv);
	else
		updatePlot(pv_index);


	global_settings.viewer.update(0, false);

	$('#archived_PVs').hide();
	$(document.body).children().css('opacity', '1.0');
}

$('#PV').keypress(function (key) {

	if (key.which == KEY_ENTER) {

		var jsonurl = ARCHIVER_URL + RETRIEVAL +'/bpl/getMatchingPVs?pv=' + $('#PV').val() + "&limit=4000";
		var components = jsonurl.split('?');
		var urlalone = components[0];

		var querystring = '';
			if(components.length > 1) {
				querystring = components[1];
			}

		var HTTPMethod = 'GET';
		if(jsonurl.length > 2048) {
			HTTPMethod = 'POST';
		}

		$.ajax({
			url: urlalone,
			data: querystring,
			type: HTTPMethod,
			dataType: 'json',
			success: function(data, textStatus, jqXHR) {

				if (textStatus == "success" && data.length > 0) {

					$("#table_PVs tr").remove();

					for (i = 0; i < data.length; i++) {
						var row;

						if (!(i % PV_PER_ROW)) {
							row = $("<tr></tr>")
							row.appendTo($("#table_PVs"));
						}

						$('<td></td>').attr('id', 'pv' + i).text(data[i]).appendTo(row);
						$('#pv' + i).click(click_handler);

					}

					$(document.body).children().css('opacity', '0.4');
					$("#archived_PVs").show();
					$("#archived_PVs").css('opacity', '1.0');
					$("#archived_PVs").height((Math.ceil(data.length/PV_PER_ROW) + 1) * 50);
				}

			},
			error: function(xmlHttpRequest, textStatus, errorThrown) {
				alert("An error occured on the server while disconnected PVs -- " + textStatus + " -- " + errorThrown);
			}
		});
	}
});

$("#archiver_viewer")
.mousedown(function(evt) {
	global_settings.dragging.isDragging = false;
	global_settings.dragging.mouseDown = true;
	global_settings.dragging.x = evt.offsetX;

	if (global_settings.zoom.isZooming) {
		global_settings.zoom.begin_x = evt.clientX;
		global_settings.zoom.begin_y = evt.clientY;
		global_settings.zoom.hasBegan = true;

		$("#canvas_area span.selection_box").css("display","block");

		//var chart_evt = Chart.Interaction.modes.nearest(global_settings.viewer, evt, global_settings.viewer.options.tooltips);
		//if (chart_evt.length > 0) {
			//var elem = chart_evt[0];
			//global_settings.zoom.time_1 = global_settings.plotted_data[elem._datasetIndex].data.data[elem._index].x;
		//}

		global_settings.zoom.time_1 = new Date(global_settings.start_time.getTime() + evt.offsetX * TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / global_settings.viewer.chart.width );
	}
})
.mousemove(function(evt) {

	if (!global_settings.zoom.isZooming && !global_settings.auto_enabled && global_settings.dragging.mouseDown) {

		global_settings.dragging.isDragging = true;

		var offset_x = global_settings.dragging.x - evt.offsetX,
		new_date = new Date(global_settings.end_time.getTime() + offset_x * TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / global_settings.viewer.chart.width );

		global_settings.dragging.x = evt.offsetX;

		setEndTime(new_date, true);

		updateTimeScale(global_settings.window_time);

		updateAllPlots(true);

		global_settings.viewer.update(0, false);
	}

	if (global_settings.zoom.isZooming && global_settings.zoom.hasBegan) {

            // x,y,w,h = o retângulo entre os vértices
			var x = Math.min(global_settings.zoom.begin_x, evt.clientX);
			var y = Math.min(global_settings.zoom.begin_y, evt.clientY);
			var w = Math.abs(global_settings.zoom.begin_x - evt.clientX);
			var h = Math.abs(global_settings.zoom.begin_y - evt.clientY);

			$("#canvas_area span.selection_box").css("left", x + "px");
			$("#canvas_area span.selection_box").css("top", "0");
			$("#canvas_area span.selection_box").css("width", w + "px");
			$("#canvas_area span.selection_box").css("height", global_settings.viewer.chart.height  + "px");
	}
 })
.mouseup(function(evt) {
	global_settings.dragging.isDragging = false;
	global_settings.dragging.mouseDown = false;

	/*
	Uncomment to disable auto refresh on dragging
	updateAllPlots();
	global_settings.viewer.update(0, false);
	*/

	if (global_settings.zoom.isZooming && global_settings.zoom.hasBegan) {

		/*var chart_evt = Chart.Interaction.modes.nearest(global_settings.viewer, evt, global_settings.viewer.options.tooltips);
		if (chart_evt.length > 0) {
			var elem = chart_evt[0];
			global_settings.zoom.time_2 = global_settings.plotted_data[elem._datasetIndex].data.data[elem._index].x;
		}*/

		global_settings.zoom.time_2 = new Date(global_settings.start_time.getTime() + evt.offsetX * TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / global_settings.viewer.chart.width );

		if (global_settings.zoom.time_1 != undefined && global_settings.zoom.time_2 != undefined){

			if (global_settings.zoom.time_1.getTime() < global_settings.zoom.time_2.getTime()) {
				global_settings.start_time = global_settings.zoom.time_1;
				global_settings.end_time = global_settings.zoom.time_2;
			}
			else {
				global_settings.start_time = global_settings.zoom.time_2;
				global_settings.end_time = global_settings.zoom.time_1;
			}

			var i = 0;
			while (global_settings.end_time.getTime() - global_settings.start_time.getTime() < TIME_AXIS_PREFERENCES[i].milliseconds && i < TIME_IDS.SEG_30)
				i++;

			$('#window_table tr').eq(0).find('td').eq(global_settings.window_time)[0].className = "unpushed";
			$('#window_table tr').eq(0).find('td').eq(i)[0].className = "pushed";

			if (TIME_AXIS_PREFERENCES[i].optimized)
				$("#obs").fadeIn();
	        	else $("#obs").fadeOut();

			global_settings.zoom.hasBegan = false;
			$("#canvas_area span.selection_box").hide();
			$("#canvas_area span.selection_box").css("width", 0);
			$("#canvas_area span.selection_box").css("height", 0);

			global_settings.window_time = i;
			updateTimeScale(global_settings.window_time);
			updateAllPlots(true);

			global_settings.viewer.update(0, false);

		}
	}

	global_settings.zoom.hasBegan = false;
	global_settings.zoom.isZooming = false;
	$("#date .zoom").css('background-color',"white");

});

$("#archiver_viewer").on('click', function (evt) {

	if (!global_settings.dragging.isDragging) {

		var event = global_settings.viewer.getElementAtEvent(evt);

		if (event != undefined && event.length > 0) {

			var	dataset_index = event[0]._datasetIndex,
				index = event[0]._index,
				event_data = global_settings.viewer.data.datasets[dataset_index].data[index].x,
				d = new Date(event_data.getTime() + TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / 2);

			$("#date .loading").show();

			//setEndTime(d, true);
			setEndTime(event_data, true);

			updateTimeScale(global_settings.window_time);

			updateAllPlots();

			global_settings.viewer.update(0, false);

			$("#date .loading").hide();
		}
	}
});

$("#date .zoom").on("click", function (e) {

	if (global_settings.zoom.isZooming) {
		$(this).css('background-color',"white");
		global_settings.zoom.isZooming = false;
	}
	else {
		$(this).css('background-color',"lightgrey");
		global_settings.zoom.isZooming = true;
	}

});

$("#date .auto").on("click", function (e) {

	if (global_settings.auto_enabled) {

		$(this).css('background-color',"white");
		global_settings.auto_enabled = false;

		clearInterval(global_settings.timer);
	}
	else {

		global_settings.timer = setInterval(function () {

			//setEndTime(new Date(global_settings.end_time.getTime() + REFRESH_INTERVAL * 1000), true);
			$("#date .loading").show();

			setEndTime(new Date(), true);
			updateTimeScale(global_settings.window_time);

			updateAllPlots();
			global_settings.viewer.update(0, false);
			$("#date .loading").hide();

		}, REFRESH_INTERVAL * 1000);

		$(this).css('background-color',"lightgrey");
		global_settings.auto_enabled = true;
	}

});

$("#date").on('change', 'input', function (e) {

	var 	date = $("#day").val().split("/"),
		day = parseInt(date[0]),
		month = parseInt(date[1]) - 1,
		year = parseInt(date[2]),
		hours = parseInt($("#hour").val()),
		minutes = parseInt($("#minute").val()),
		seconds = parseInt($("#second").val()),

	new_date = new Date(year,month, day, hours, minutes, seconds, 0);

	$("#date .loading").show();

	setEndTime(new_date, false);

	updateAllPlots();

	updateTimeScale(global_settings.window_time);

	global_settings.viewer.update(0, false);

	$("#date .loading").hide();
});

$(document).click(function(e) {

	if( e.target.id != 'archived_PVs' && !$('#archived_PVs').find(e.target).length) {
		$('#archived_PVs').hide();
		$(document.body).children().css('opacity', '1.0');
	}
});


$(document).ready(function () {

	global_settings.viewer = new Chart($("#archiver_viewer"), {

		type: 'line',
		data: [],
		options: {

			animation: {
				duration: 0,
			},

			tooltips: {
				mode: 'nearest',
				intersect: false,
			},

			hover: {
				mode: 'nearest',
				intersect: false,
			},

			title: {
				display: true,
				text: "LNLS Archiver Web Viewer",
			},

			scales: {
				xAxes: [{
					// Common x axis
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

				onClick : function(e, legendItem) {


					var meta = global_settings.viewer.getDatasetMeta(legendItem.datasetIndex);

					var unit = meta.yAxisID;

					if (meta.hidden) {

						global_settings.y_axis_ids[unit]++
						global_settings.viewer.scales[unit].options.display = true;

						meta.hidden = null;

					}
					else {

						meta.hidden = true;
						global_settings.y_axis_ids[unit]--;

						if (global_settings.y_axis_ids[unit] <= 0)
							global_settings.viewer.scales[unit].options.display = false;

					}

					global_settings.viewer.update(0, false);
				}

			},

			maintainAspectRatio: false,
		}
	});

	global_settings.auto_enabled = false;
	global_settings.window_time = TIME_IDS.MIN_10;
	global_settings.zoom = {};
	global_settings.zoom.isZooming = false;
	global_settings.zoom.hasBegan = false;

  	$("#obs").hide();

	document.getElementsByClassName('enable_table')[0].checked = false;

	ARCHIVER_URL = window.location.origin;

    $("#day").datepicker({dateFormat: "dd/mm/yy"});

	setEndTime(new Date(), true);

	if (window.location.search != ""){

		var search_paths = window.location.search.split('&'), i;

		for (i = 0; i < search_paths.length; i++){

			pv = search_paths[i].substr(search_paths[i].indexOf("=") + 1);
			addNewPV(pv);
		}
	}

	updateTimeScale(global_settings.window_time);

	global_settings.viewer.update(0, false);

});

$('#data_table_area .enable_table:checkbox').change(function(evt) {

        if (this.checked) {

		updateDataTable();
		$('#data_table_area .data_table').show();

	}
	else {
		$("#data_table_area .data_table").remove();
		$("#data_table_area h2").remove();
		$('#data_table_area .data_table').hide();
	}

});

// Auxiliary functions

function pad_with_zeroes(number, length) {

	var my_string = '' + number;
	while (my_string.length < length) {
		my_string = '0' + my_string;
	}

	return my_string;
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
