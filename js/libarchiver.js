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
	
	global_settings.end_time = date;
	
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

		global_settings.window_time = e.target.cellIndex;
		
		updateTimeScale(viewer, global_settings.window_time);		
	}
}

function updateTimeScale(chart, new_index) {
	
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.unit = TIME_AXIS_PREFERENCES[new_index].unit;
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.unitStepSize = TIME_AXIS_PREFERENCES[new_index].unitStepSize;
	
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.min = new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[new_index].milliseconds);
	chart.options.scales.xAxes[TIME_AXIS_INDEX].time.max = global_settings.end_time;
	
	console.log (new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[new_index].milliseconds));
	
	chart.update();
}

function addDataset(c_chart, pv_data) {

	const pv_name = pv_data[0].meta.name;
	
	var all = [];
	var _data = pv_data[0].data;
	
	for (i = 0; i < _data.length; i++) {

		var _x = new Date(0);
		_x.setUTCSeconds(_data[i].secs + _data[i].nanos * 1e-9);
		
		all.push({
			x : _x, 
			y : _data[i].val
		});
	}
		
	addYAxis(c_chart, pv_name)
	
	var new_dataset = {

		label : pv_name,
		xAxisID: TIME_AXIS_ID,
		yAxisID: pv_name,
		data : all,
		showLine : true,
		steppedLine : true,
		fill : false,
		backgroundColor : "rgb(" + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + ")",
	};

	global_settings.push({
		pv : pv_name,
		data : new_dataset
	});
	
	c_chart.data.datasets.push(new_dataset);
	
	c_chart.update();
}

function addYAxis(c_chart, n_id) {

	var scaleOptions =  jQuery.extend(true, {}, SCALE_DEFAULTS)

	scaleOptions.type = "linear";
	scaleOptions.position = "left";
	scaleOptions.id = n_id;

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

function click_handler(e) {

	var pv = e.target.innerText,
		pv_index = isAlreadyPlotted(pv);
	
	if (pv_index == null) {
	
		var	from_date = new Date(global_settings.end_time - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds),
			data = requestData(pv, from_date, global_settings.end_time);
	
		addDataset(viewer, data);
		
	} else {
		
		var min = new Date(global_settings.end_time - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds),
			first = global_settings.plotted_data[pv_index].data[0].x
			last = global_settings.plotted_data[pv_index].data[global_settings.plotted_data[pv_index].length - 1].x;
		
		// we need to append data to the beginning of the data set
		if (first.getTime() > min.getTime()) {
			
			var new_data = requestData(pv, min, first)[0].data;
			
			new_data.pop(); // remove last element, which is already in the dataset
			
			var all = [];
			for (i = 0; i < new_data.length; i++) {

				var _x = new Date(0);
				_x.setUTCSeconds(new_data[i].secs + new_data[i].nanos * 1e-9);
				
				all.push({
					x : _x, 
					y : new_data[i].val
				});
			}
			
			global_settings.plotted_data[pv_index].data.unshift(all);
		}
		
		if (last.getTime() < global_settings.end_time.getTime()) {
			
			var new_data = requestData(pv, last, global_settings.end_time)[0].data;
			
			new_data.shift();

			var all = [];
			for (i = 0; i < new_data.length; i++) {

				var _x = new Date(0);
				_x.setUTCSeconds(new_data[i].secs + new_data[i].nanos * 1e-9);
				
				all.push({
					x : _x, 
					y : new_data[i].val
				});
			}
			
			global_settings.plotted_data[pv_index].data.push(all);
		}
		
		viewer.update();
	}
	
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

var viewer = new Chart($("#archiver_viewer"), {

	type: 'line',
	data: [],
	options: {

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
			text: "Exemplo",
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


$("#archiver_viewer")
.mousedown(function(evt) {
	dragging.isDragging = false;
	dragging.mouseDown = true;
	dragging.x = evt.offsetX;
})
.mousemove(function(evt) {
	dragging.isDragging = true;
	
	if (dragging.mouseDown) {
	
		var offset_x = dragging.x - evt.offsetX,
			new_date = new Date(global_settings.end_time.getTime() + offset_x * TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / (viewer.chart.width) );
		
		dragging.x = evt.offsetX;
		
		setEndTime(new_date, true);
		
		updateTimeScale(viewer, global_settings.window_time);
	}
 })
.mouseup(function(evt) {
	dragging.isDragging = false;
	dragging.mouseDown = false;
});

$("#archiver_viewer").on('click', function (evt) {
	
	if (!dragging.isDragging) {
		
		var event = viewer.getElementAtEvent(evt);
		
		if (event != undefined && event.length > 0) {
		
			var	dataset_index = event[0]._datasetIndex,
				index = event[0]._index,
				event_data = viewer.data.datasets[dataset_index].data[index].x,
				d = new Date(event_data.getTime() + TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds / 2);
		
			//setEndTime(d, true);
			setEndTime(event_data, true);
			
			updateTimeScale(viewer, global_settings.window_time);
		}
	}
});

$("#window_size table tr td").on("click", changeWindowSize);

$("#date .now").on("click", function (e) {
	
	setEndTime(new Date(), true);
	
	updateTimeScale(viewer, global_settings.window_time);
});

$("#date .backward").on("click", function (e) {
	
	setEndTime(new Date(global_settings.end_time.getTime() - TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds), true);
	
	updateTimeScale(viewer, global_settings.window_time);
});

$("#date .forward").on("click", function (e) {
	
	setEndTime(new Date(global_settings.end_time.getTime() + TIME_AXIS_PREFERENCES[global_settings.window_time].milliseconds), true);
	
	updateTimeScale(viewer, global_settings.window_time);
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
	
	updateTimeScale(viewer, global_settings.window_time);
});

$(document).click(function(e) {

	if( e.target.id != 'archived_PVs' && !$('#archived_PVs').find(e.target).length) {
		$('#archived_PVs').hide();
		$(document.body).children().css('opacity', '1.0');
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