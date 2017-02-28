const KEY_ENTER = 13;
const ARCHIVER_URL = "http://localhost:11998";
const RETRIEVAL = "/retrieval";
const MGMT = "/mgmt";
const PV_PER_ROW = 4;

const SCALE_DEFAULTS = Chart.defaults.scale

const TIME_AXIS_ID = "x-axis-0"
	
function addDataset(c_chart, pv_name, pv_data) {

	var all = [];
	var _data = pv_data[0].data;
	
	for (i = 0; i < _data.length; i++) {

		var _x = new Date(0);
		_x.setUTCSeconds(_data[i].secs + _data[i].nanos * 1e-9);
	
		var elem = {
				x : _x, 
				y : _data[i].val
		}
		
		all.push(elem);
	}
		
	addYAxis(c_chart, pv_name)
	
	c_chart.data.datasets.push({

		label : pv_name,
		xAxisID: TIME_AXIS_ID,
		yAxisID: pv_name,
		data : all,
		showLine : true,
		steppedLine : true,
		fill : false,
		backgroundColor : "rgb(" + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + "," + getRandomInt(0, 255) + ")",
	});

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

function click_handler(e) {

	var offset = new Date().getTimezoneOffset();
	var sign = '+';

	if (offset > 0)
		sign = '-';

	var hours = offset/60;
	var minutes = offset % 60;

	var pv = e.target.innerText;

	var jsonurl = ARCHIVER_URL + RETRIEVAL +'/data/getData.json?pv=' + pv + "&from=2017-02-24T14:50:00.000" + sign + pad_with_zeroes(hours, 2) + ":" + pad_with_zeroes(minutes, 2);

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

	$.ajax ({
		url: urlalone,
		data: querystring,
		type: HTTPMethod,
		dataType: 'json',
		success: function(data, textStatus, jqXHR) {

			if (textStatus == "success" && data[0].data.length > 0) {

				var data_x = [],  data_y = [];
				for (i = 0; i < data[0].data.length; i++) {

					var d = new Date(0);
					d.setUTCSeconds(data[0].data[i].secs);

					data_x.push(moment(data[0].data[i].secs));
					data_y.push(data[0].data[i].val);
				}

				viewer.options.scales.xAxes[0].type = 'time';
				viewer.options.scales.xAxes[0].time =  {
						displayFormats: {
							quarter: 'MMM YYYY'
						}
				};

				viewer.data.labels = data_x;
				viewer.data.datasets.push({

					data : data_y,
					showLine : false,
					steppedLine : true

				});

				viewer.update();
				$('#archived_PVs').hide();
				$(document.body).children().css('opacity', '1.0');
			}
		},
		error: function(xmlHttpRequest, textStatus, errorThrown) {
			alert("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
		}
	});
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
						minute: 'HH:mm:ss'
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