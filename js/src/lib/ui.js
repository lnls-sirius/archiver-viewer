module.exports = (function () {

    const PV_PER_ROW = 4;
    const PV_PER_ROW_DATA_TABLE = 8;
    const PV_MAX_ROW_PER_PAGE = 10;
    const PV_PER_ROW_INFO = 4;

    var current_page = 0;
    var selectedPVs = [];

    /* Miscellaneous functions  */
    function pad_with_zeroes(number, length) {

        var my_string = '' + number;
        while (my_string.length < length) {
            my_string = '0' + my_string;
        }

        return my_string;
    }

    var updateDateComponents = function (date) {

        var day   = ("0" + date.getDate()).slice(-2),
            month = ("0" + (date.getMonth() + 1)).slice(-2);

        $("#day").val(date.getFullYear() + "-" + month + "-" + day);
        $("#hour").val(pad_with_zeroes(date.getHours(), 2));
        $("#minute").val(pad_with_zeroes(date.getMinutes(), 2));
        $("#second").val(pad_with_zeroes(date.getSeconds(), 2));
    };

    var toogleWindowButton = function (toPush, toUnpush) {

        /* Untoggled pushed button */
        if (toUnpush != undefined)
            $('#window_table tr').eq(0).find('td').eq(toUnpush)[0].className = "unpushed";

        if (toPush != undefined)
            $('#window_table tr').eq(0).find('td').eq(toPush)[0].className = "pushed";
    };

    var enableLoading = function (){
        $("#date .loading").show();
    };

    var disableLoading = function (){

        $("#date .loading").hide();
    };

    var showWarning = function (){

        $("#obs").fadeIn();
    };

    var hideWarning = function (){

        $("#obs").fadeOut();
    };

    var getTimedate = function () {

        var date    = $("#day").val().split("-"),
            day     = parseInt(date[2]),
            month   = parseInt(date[1]) - 1,
            year    = parseInt(date[0]),
            hours   = parseInt($("#hour").val()),
            minutes = parseInt($("#minute").val()),
            seconds = parseInt($("#second").val());

        return new Date (year, month, day, hours, minutes, seconds, 0);
    };

    var disableDate = function () {

        $("#day").prop('disabled', true);
        $("#hour").prop('disabled', true);
        $("#minute").prop('disabled', true);
        $("#second").prop('disabled', true);
    };

    var enableDate = function () {

        $("#day").prop('disabled', false);
        $("#hour").prop('disabled', false);
        $("#minute").prop('disabled', false);
        $("#second").prop('disabled', false);
    };

    var toogleSearchWarning = function (warning) {

        $("#warning h4").text (warning);

        showSearchWarning ();

        var timer = setInterval(function () {

            hideSearchWarning ();
            clearInterval (timer);

        }, 5000);

    };

    var checkboxes = [];

    var showSearchResultsAtPage = function (index, data) {

        $("#table_PVs tr").remove();

        checkboxes = []

        var i;
        for (i = index * PV_MAX_ROW_PER_PAGE * PV_PER_ROW; i < data.length && i < ((index + 1) * PV_MAX_ROW_PER_PAGE * PV_PER_ROW); i++) {

            var row;
            if (!( (i - index * PV_MAX_ROW_PER_PAGE * PV_PER_ROW) % PV_PER_ROW )) {
                row = $("<tr></tr>");
                row.appendTo($("#table_PVs"));
            }

            var tdCheckbox = $('<td></td>');

            checkboxes.push ($('<input />').attr({"type" : "checkbox", "checked" : selectedPVs.indexOf (data[i]) > -1}).click({"name" : data[i]}, function (event) {
                if (this.checked)
                  selectedPVs.push (event.data.name)
                else
                  selectedPVs.splice (selectedPVs.indexOf (event.data.name), 1);

                console.log (selectedPVs)
            }).appendTo (tdCheckbox));

            $('<label></label>').text(data[i]).appendTo (tdCheckbox);

            tdCheckbox.appendTo (row);
        }
    };

    var selectedAllPVs = function (e) {

        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes [i].prop('checked', true).triggerHandler("click");
        }
    }

    var deselectedAllPVs = function (e) {

        for (var i = 0; i < checkboxes.length; i++)
          checkboxes [i].prop('checked', false).triggerHandler("click");
    }

    var showSearchResults = function (data) {

        if (data != null && data.length > 0) {

            if (data.length > 1)
                $("#archived_PVs h2").text(data.length + " PVs have been found.");
            else
                $("#archived_PVs h2").text("1 PV has been found.");

            current_page = 0;
            selectedPVs = [];

            showSearchResultsAtPage (0, data);

            $(document.body).children().css ('opacity', '0.3');
            $("#archived_PVs").show ();
            $("#archived_PVs").css ('opacity', '1.0');

            $("#previous").hide();

            $("#previous").unbind().click ({pvs: data}, function (event) {

                current_page = current_page - 1;
                showSearchResultsAtPage (current_page, event.data.pvs);

                if (!current_page)
                    $("#previous").hide();

                $("#next").show();
            });

            $("#next").unbind().click ({pvs: data}, function (event) {

                current_page = current_page + 1;
                showSearchResultsAtPage (current_page, event.data.pvs);

                if ((current_page + 1) * PV_MAX_ROW_PER_PAGE * PV_PER_ROW >= event.data.pvs.length )
                    $("#next").hide();

                $("#previous").show();
            });

            if (data.length <= PV_MAX_ROW_PER_PAGE * PV_PER_ROW)
                $("#next").hide();
            else
                $("#next").show();
        }
        else if (data != null)
            toogleSearchWarning ("No PVs corresponding to the search string have been found.");
    };

    var hideSearchedPVs = function () {

        $('#archived_PVs').hide();
        $(document.body).children().css('opacity', '1.0');
    }

    var refreshScreen = function (event) {

        if (event.target.id != 'archived_PVs' && !$('#archived_PVs').find(event.target).length)
            hideSearchedPVs();
    }

    var toggleZoomButton = function (enable) {
        if (enable)
            $("#date .zoom").css('background-color',"lightgrey");
        else
            $("#date .zoom").css('background-color',"white");
    }

    var hideZoomBox = function () {
        $("#canvas_area span.selection_box").hide();
        $("#canvas_area span.selection_box").css("width", 0);
        $("#canvas_area span.selection_box").css("height", 0);
    };

    var drawZoomBox = function (x, w, h) {

        $("#canvas_area span.selection_box").css("left", x + "px");
        $("#canvas_area span.selection_box").css("top", "0");
        $("#canvas_area span.selection_box").css("width", w + "px");
        $("#canvas_area span.selection_box").css("height", h  + "px");
    };

    var updateAddress = function (searchString) {
        var newurl = window.location.pathname + searchString;
        if (history.pushState)
            window.history.pushState({path:newurl}, '', newurl);
    };

    /**
    * updateDataTable draws a table below the char containing the data that is
    * currently being rendered.
    **/
    var updateDataTable = function (datasets, start, end) {

        // Remove all data before rewriting
        $("#data_table_area .data_table").remove();
        $("#data_table_area h2").remove();

        // Draws a table for each variable chosen by the user
        for (var i = 0; i < datasets.length; i++){

            var table = $('<table></table>').addClass('data_table'),
                pv_data = datasets[i].data,
                count = 0;

            $('#data_table_area').append($('<h2></h2>').text(datasets[i].label));

            for (var j = 0; j < pv_data.length; j++) {
                var row;
                if ((pv_data[j].x.getTime() >= start.getTime()) &&
                    (pv_data[j].x.getTime() <= end.getTime())) {

                    if (!(count % PV_PER_ROW_DATA_TABLE)) {
                        row = $("<tr></tr>")
                        row.appendTo(table);
                    }

                    count++;

                    $('<td></td>').attr('class', 'pv_time').text(pv_data[j].x.toLocaleDateString() + " " + pv_data[j].x.toLocaleTimeString()).appendTo(row);
                    $('<td></td>').attr('class', 'pv_value').text(pv_data[j].y.toFixed(datasets[i].pv.precision)).appendTo(row);
                }
            }

            $('#data_table_area').append(table);
        }
    };

    var showTable = function () {
        $('#data_table_area .data_table').show();
    };

    var resetTable = function () {
        $("#data_table_area .data_table").remove();
        $("#data_table_area h2").remove();
        $('#data_table_area .data_table').hide();
    };

    var updatePVInfoTable = function (datasets, legendHandler, optimizeHandler, removeHandler) {
        var row;
        // Remove all data before rewriting
        $("#data_pv_info .pv_info_table").remove();
        var table = $('<table></table>').addClass('pv_info_table');
        // Draws a table for each variable chosen by the user
        for (var i = 0; i < datasets.length; i++){

            if (!(i % PV_PER_ROW_INFO)) {
                row = $("<tr></tr>");
                row.appendTo(table);
            }

            $('<td></td>').css({"background-color": datasets[i].backgroundColor, "width": "30px", "cursor" : "pointer"}).click({"datasetIndex" : i}, legendHandler).appendTo(row);
            $('<td></td>').text(datasets[i].label).appendTo(row);

            var tdOptimized = $('<td></td>');
                $('<input />')
                    .attr({"type" : "checkbox", "checked" : datasets[i].pv.optimized, "disabled" : datasets[i].pv.type == "DBR_SCALAR_ENUM"}).click({"datasetIndex" : i}, optimizeHandler).appendTo (tdOptimized);

            var div = $('<label></label>')
                .attr('class', 'tooltip')
                .text('Optimize?');
            $('<span></span>')
                .attr('class', 'tooltiptext')
                .text('Uncheck it if you want raw data sent from the server.')
                .appendTo(div);
            div.appendTo (tdOptimized);
            tdOptimized.appendTo(row);

            // var div = $('<label></label>')
            //     .attr('class', 'tooltip')
            //     .text('Logarithmic?');
            // $('<span></span>')
            //     .attr('class', 'tooltiptext')
            //     .text('Check it if you want logarithimc scale.')
            //     .appendTo(div);
            // div.appendTo(tdOptimized);w
            // tdOptimized.appendTo(row);

            var tdRemove = $('<td></td>');
            tdRemove
                .css({"cursor" : "pointer"})
                .text("Remove")
                .click ({"datasetIndex" : i}, removeHandler);
            tdRemove.appendTo(row);
        }

        $('#data_pv_info').append(table);
    };

    var showSearchWarning = function (){
        $("#warning").fadeIn();
    };

    var hideSearchWarning = function (){
        $("#warning").fadeOut();
    };

    var disable = function (button) {
        button.addClass("disabled");
        button.css({"background-color" : "lightblue", "cursor" : "default", "pointerEvents" : "none"});
    };

    var enable = function (button) {
        button.removeClass("disabled");
        button.css({"background-color" : "white", "cursor" : "pointer", "pointerEvents" : "auto"});
    };

    var isEndSelected = function () {
        return ($('#date .type').find(":selected").text() == "END");
    };

    var enableReference = function (i) {
        $('#date .type>option:eq(' + (1 - i) + ')').prop('selected', false);
        $('#date .type>option:eq(' + i + ')').prop('selected', true);
    };

    return {

        selectedPVs: function () { return selectedPVs; },

        updateDateComponents : updateDateComponents,
        toogleWindowButton: toogleWindowButton,
        enableLoading: enableLoading,
        disableLoading: disableLoading,
        showWarning: showWarning,
        hideWarning: hideWarning,
        getTimedate: getTimedate,
        enableDate: enableDate,
        disableDate: disableDate,
        showSearchResultsAtPage: showSearchResultsAtPage,
        showSearchResults: showSearchResults,
        hideSearchedPVs: hideSearchedPVs,
        refreshScreen: refreshScreen,
        toggleZoomButton: toggleZoomButton,
        hideZoomBox: hideZoomBox,
        drawZoomBox:drawZoomBox,
        updateAddress: updateAddress,
        updateDataTable: updateDataTable,
        showTable: showTable,
        resetTable: resetTable,
        updatePVInfoTable: updatePVInfoTable,
        showSearchWarning: showSearchWarning,
        hideSearchWarning: hideSearchWarning,
        toogleSearchWarning: toogleSearchWarning,
        disable: disable,
        enable: enable,
        isEndSelected: isEndSelected,
        enableReference: enableReference,
        selectedAllPVs: selectedAllPVs,
        deselectedAllPVs: deselectedAllPVs,
    };

})();
