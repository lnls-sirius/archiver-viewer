
var global_settings = {
	window_time : TIME_IDS.MIN_10,
	plotted_data: []
}

var dragging = {
	isDragging : false,
}


function setEndTime(date, updateHtml) {
	
	if (updateHtml == undefined || updateHtml == null)
		updateHtml = false;

	var now = new Date();	

	if (date.getTime() <= now.getTime())
		global_settings.end_time = date;
	else 
		global_settings.end_time = now;
	

	global_settings.start_time = new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds);
	
	if (updateHtml) {
		
		$("#day").val(pad_with_zeroes(date.getDate(), 2) + "/" + pad_with_zeroes(date.getMonth()+1, 2) + "/" + date.getFullYear());
		$("#hour").val(pad_with_zeroes(date.getHours(), 2))
		$("#minute").val(pad_with_zeroes(date.getMinutes(), 2))
		$("#second").val(pad_with_zeroes(date.getSeconds(), 2))
	}
}

function changeWindowSize(e) {
	
	if (e.target.className == "unpushed") {
		
		$('#window_table tr').eq(0).find('td').eq(global_settings.window_time)[0].className = "unpushed";
		
		e.target.className = "pushed";

		var i;
		for (i = 0; i < global_settings.plotted_data.length; i++) {
			global_settings.plotted_data[i].data.data.length = 0;
		}


		global_settings.window_time = e.target.cellIndex;
	
		$("#date .loading").show();

		global_settings.start_time = new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds);
	
		updateAllPlots();
		
		updateTimeScale(global_settings.viewer, global_settings.window_time);
	
		global_settings.viewer.update();

		$("#date .loading").hide();

		if (document.getElementsByClassName('enable_table')[0].checked) {
			updateDataTable();
			$('#data_table_area .data_table').show();
		}
	}
}

function updateDataTable() {
	
	$("#data_table_area .data_table").remove();
	$("#data_table_area h2").remove();

	var i, j;

	for (i = 0; i < global_settings.plotted_data.length; i++){

		var table = $('<table></table>').addClass('data_table'),
		    pv_data = global_settings.plotted_data[i].data.data,
		    count = 0;		

		$('#data_table_area').append($('<h2></h2>').text(global_settings.plotted_data[i].pv));

		for (j = 0; j < pv_data.length; j++) {

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

function updateTimeScale(chart, new_index) {
	
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.unit = TIME_AXIS_PREFERENCES[new_index].unit;
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.unitStepSize = TIME_AXIS_PREFERENCES[new_index].unitStepSize;
	
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.min = global_settings.start_time;
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.max = global_settings.end_time;
}

function addDataset(c_chart, pv_data) {

	const pv_name = pv_data[0].meta.name;
	
	var all = parseData(pv_data[0].data);
		
	addYAxis(c_chart, pv_name, parseInt(pv_data[0].meta.PREC) + 1)
	
	var new_dataset = {

		label : pv_name,
		xAxisID: TIME_AXIS_ID,
		yAxisID: pv_name,
		data : all,
		showLine : true,
		steppedLine : true,
		fill : false,
		pointRadius : 2,
		backgroundColor : "rgb(" + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + ")",
	};

	global_settings.plotted_data.push({
		pv : pv_name,
		data : new_dataset,
		precision: parseInt(pv_data[0].meta.PREC) + 1,
	});
	
	c_chart.data.datasets.push(new_dataset);
}

function addYAxis(c_chart, n_id, ticks_precision) {

	var scaleOptions =  jQuery.extend(true, {}, SCALE_DEFAULTS)

	if (ticks_precision == undefined)
		ticks_precision = 3;

	scaleOptions.type = "linear";
	scaleOptions.position = "left";
	scaleOptions.id = n_id;

	scaleOptions.ticks.callback = function (value) {
		
		return value.toFixed(ticks_precision);
	};

	
	var scaleClass = Chart.scaleService.getScaleConstructor("linear");

	var n_scale = new scaleClass({
		id: n_id,
		options: scaleOptions,
		ctx: c_chart.chart.ctx,
		chart: c_chart
	});

	c_chart.scales[n_id] = n_scale;		

	Chart.layoutService.addBox(c_chart, n_scale);

}

function requestData(pv, from, to) {
	
	if (from == undefined || to == undefined)
		return null;
	
	var jsonurl = ARCHIVER_URL + RETRIEVAL +'/data/getData.json?pv=' + pv + "&from=" + from.toJSON() + "&to=" + to.toJSON();

	var components = jsonurl.split('?'),
		urlalone = components[0],
		querystring = '';
	
	if(components.length > 1) {
		querystring = components[1];
	}

	var HTTPMethod = 'GET';
	if(jsonurl.length > 2048) {
		HTTPMethod = 'POST';
	}

	var return_data = null;
	
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

function isAlreadyPlotted(pv_name) {
	
	var i;
	
	for (i = 0; i < global_settings.plotted_data.length; i++)
		if (global_settings.plotted_data[i].pv == pv_name)
			return i;		
	
	return null;
}

function updateAllPlots() {

	var i;
	for (i = 0; i < global_settings.plotted_data.length; i++)
		updatePlot(i);

}

function parseData(data) {

	var r_data = [], i = 0;

	while(i < data.length) {

		var _x = new Date(0);
		_x.setUTCSeconds(data[i].secs + data[i].nanos * 1e-9);
		
		if (!isNaN( _x.getTime())) {

			r_data.push({
				x : _x, 
				y : data[i].val
			});
		}

		if (global_settings.window_time < TRIM_LIMIT)
			i = i + TRIM_STEP;
		else 
			i++;
	}

	return r_data;
}

function updatePlot(pv_index) {

	if (global_settings.plotted_data[pv_index].data.data.length > 0) {
		
		var first = global_settings.plotted_data[pv_index].data.data[0].x;

		// we need to append data to the beginning of the data set
		if (first.getTime() > global_settings.start_time.getTime()) {
		
			var new_data = requestData(global_settings.plotted_data[pv_index].pv, global_settings.start_time, first)[0].data;
		
			new_data.pop(); // remove last element, which is already in the dataset
			new_data.pop(); // remove last element, which is already in the dataset
		
			Array.prototype.unshift.apply(global_settings.plotted_data[pv_index].data.data, parseData(new_data));
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
		
			var new_data = requestData(global_settings.plotted_data[pv_index].pv, last, global_settings.end_time)[0].data;
		
			new_data.shift();
			new_data.shift();
		
			Array.prototype.push.apply(global_settings.plotted_data[pv_index].data.data, parseData(new_data));
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

		var new_data = requestData(global_settings.plotted_data[pv_index].pv, global_settings.start_time,  global_settings.end_time)[0].data;
		Array.prototype.push.apply(global_settings.plotted_data[pv_index].data.data, parseData(new_data));
	}
}

function checkDataSize(pv_index) {

	var i;
	for (i = 0; i < global_settings.plotted_data[pv_index].data.data.length; i++) {
	    global_settings.plotted_data[pv_index].data.data.splice(i, TRIM_STEP);
	};
}

function addNewPV(pv) {

	var data = requestData(pv, global_settings.start_time, global_settings.end_time);

	if (data == undefined || data == null || data[0].data.length == 0)
		alert("No data was received from server.");
	else 
		addDataset(global_settings.viewer, data);

}

function click_handler(e) {

	var 	pv = e.target.innerText,
		pv_index = isAlreadyPlotted(pv);
	
	if (pv_index == null)
		addNewPV(pv);
	else
		updatePlot(pv_index);
	
	
	global_settings.viewer.update();

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
	dragging.isDragging = false;
	dragging.mouseDown = true;
	dragging.x = evt.offsetX;
})
.mousemove(function(evt) {
	
	if (dragging.mouseDown && !global_settings.auto_enabled) {

		dragging.isDragging = true;
	
		var offset_x = dragging.x - evt.offsetX,
		new_date = new Date(global_settings.end_time.getTime() + offset_x * TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / (global_settings.viewer.chart.width) );
		
		dragging.x = evt.offsetX;
		
		setEndTime(new_date, true);
		
		updateTimeScale(global_settings.viewer, global_settings.window_time);

		updateAllPlots();

		global_settings.viewer.update();
	}
 })
.mouseup(function(evt) {
	dragging.isDragging = false;
	dragging.mouseDown = false;
});

$("#archiver_viewer").on('click', function (evt) {
	
	if (!dragging.isDragging) {
		
		var event = global_settings.viewer.getElementAtEvent(evt);
		
		if (event != undefined && event.length > 0) {
		
			var	dataset_index = event[0]._datasetIndex,
				index = event[0]._index,
				event_data = global_settings.viewer.data.datasets[dataset_index].data[index].x,
				d = new Date(event_data.getTime() + TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / 2);
		
			//setEndTime(d, true);
			setEndTime(event_data, true);
			
			updateTimeScale(global_settings.viewer, global_settings.window_time);

			updateAllPlots();

			global_settings.viewer.update();
		}
	}
});

$("#window_size table tr td").on("click", changeWindowSize);

$("#date .now").on("click", function (e) {
	
	setEndTime(new Date(), true);
	
	updateTimeScale(global_settings.viewer, global_settings.window_time);

	updateAllPlots();

	global_settings.viewer.update();
});

$("#date .backward").on("click", function (e) {
	
	setEndTime(new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds), true);
	
	updateTimeScale(global_settings.viewer, global_settings.window_time);

	updateAllPlots();
	
	global_settings.viewer.update();
});

$("#date .forward").on("click", function (e) {
	
	setEndTime(new Date(global_settings.end_time.getTime() + TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds), true);
	
	updateTimeScale(global_settings.viewer, global_settings.window_time);

	updateAllPlots();

	global_settings.viewer.update();
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
			setEndTime(new Date(), true);
			updateTimeScale(global_settings.viewer, global_settings.window_time);

			updateAllPlots();
			global_settings.viewer.update();			

		}, REFRESH_INTERVAL * 1000);

		$(this).css('background-color',"lightgrey");
		global_settings.auto_enabled = true;
	}

});


$("#date").on('change', 'input', function (e) {
	
	var date = $("#day").val().split("/"),
	day = parseInt(date[0]),
	month = parseInt(date[1]) - 1,
	year = parseInt(date[2]),
	hours = parseInt($("#hour").val()),
	minutes = parseInt($("#minute").val()),
	seconds = parseInt($("#second").val()),
	
	new_date = new Date(year,month, day, hours, minutes, seconds, 0);
	
	setEndTime(new_date, false);
	
	updateTimeScale(global_settings.viewer, global_settings.window_time);

	global_settings.viewer.update();
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
				intersect: false
			},

			hover: {
				mode: 'nearest',
				intersect: false
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

			maintainAspectRatio: false,		
		}
	});

	global_settings.auto_enabled = false;
	global_settings.window_time = TIME_IDS.MIN_10;

	document.getElementsByClassName('enable_table')[0].checked = false;

	ARCHIVER_URL = window.location.origin;

	setEndTime(new Date(), true);
	
	if (window.location.search != ""){
		
		var search_paths = window.location.search.split('&'), i;

		for (i = 0; i < search_paths.length; i++){

			pv = search_paths[i].substr(search_paths[i].indexOf("=") + 1);
			addNewPV(pv);
		}
	}

	updateTimeScale(global_settings.viewer, global_settings.window_time);

	global_settings.viewer.update();
	
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
