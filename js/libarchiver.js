var KEY_ENTER = 13;
const ARCHIVER_URL = "http://localhost:11998";
const RETRIEVAL = "/retrieval";
const MGMT = "/mgmt";

const PV_PER_ROW = 4;

function pad_with_zeroes(number, length) {

	var my_string = '' + number;
	while (my_string.length < length) {
		my_string = '0' + my_string;
	}

	return my_string;

}

function click_handler(e) {

	var offset = new Date().getTimezoneOffset();
	var sign = '+';

	if (offset > 0)
		sign = '-';

	var hours = offset/60
	var minutes = offset % 60

	var pv = e.target.innerText

	var jsonurl = ARCHIVER_URL + RETRIEVAL +'/data/getData.json?pv=' + pv + "&from=2017-02-24T14:50:00.000" + sign + pad_with_zeroes(hours, 2) + ":" + pad_with_zeroes(minutes, 2)

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

				line_viewer.options.scales.xAxes[0].type = 'time'
					line_viewer.options.scales.xAxes[0].time =  {
						displayFormats: {
							quarter: 'MMM YYYY'
						}}

				line_viewer.data.labels = data_x;
				line_viewer.data.datasets.push({

					data : data_y,
					showLine : false,
					steppedLine : true

				});

				line_viewer.update()
				$('#archived_PVs').hide();
				$(document.body).children().css('opacity', '1.0')

			}

		},
		error: function(xmlHttpRequest, textStatus, errorThrown) {
			alert("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
		}
	});


}

$('#PV').keypress(function (key) {

	if (key.which == KEY_ENTER) {

		var jsonurl = ARCHIVER_URL + RETRIEVAL +'/bpl/getMatchingPVs?pv=' + $('#PV').val() + "&limit=4000"
		var components = jsonurl.split('?')
		var urlalone = components[0]
		var querystring = ''
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

						$('<td></td>').attr('id', 'pv' + i).text(data[i]).appendTo(row)
						$('#pv' + i).click(click_handler)

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



var data_test = {
		labels: ["January", "February", "March", "April", "May", "June", "July"],
		datasets: [
			{
				label: "My First dataset",
				fill: false,
				lineTension: 0.1,
				backgroundColor: "rgba(75,192,192,0.4)",
				borderColor: "rgba(75,192,192,1)",
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: "rgba(75,192,192,1)",
				pointBackgroundColor: "#fff",
				pointBorderWidth: 1,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: "rgba(75,192,192,1)",
				pointHoverBorderColor: "rgba(220,220,220,1)",
				pointHoverBorderWidth: 2,
				pointRadius: 1,
				pointHitRadius: 10,
				data: [65, 59, 80, 81, 56, 55, 40],
				spanGaps: false,
			}
			]
};

var line_viewer = new Chart($("#archiver_viewer"), {
	
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
	            type: 'time',
	            time: {
	            	unit: 'hour',
	                displayFormats: {
	                    minute: 'HH:mm:ss'
	                }
	            }
	        }],
				yAxes: [{
					type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: "left",
					id: "y-axis-1"
				}, 
//				{
//					type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
//					display: true,
//					position: "right",
//					id: "y-axis-2",
//				}
				],
		},

		responsive: true,
		maintainAspectRatio: false,		
	}

});


$(document).click(function(e) {

	if( e.target.id != 'archived_PVs' && !$('#archived_PVs').find(e.target).length) {
		$('#archived_PVs').hide();
		$(document.body).children().css('opacity', '1.0')

	}
});




