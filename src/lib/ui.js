module.exports = (function () {

    const PV_PER_ROW = 4;
    const PV_PER_ROW_DATA_TABLE = 8;
    const PV_MAX_ROW_PER_PAGE = 10;
    const PV_PER_ROW_INFO = 4;

    let currentPage = 0;
    let selectedPVs = [];

    /* Miscellaneous functions  */
    function padWithZeros(number, length) {

        let myString = "" + number;
        while (myString.length < length) {
            myString = "0" + myString;
        }

        return myString;
    }

    const updateDateComponents = function (date) {
        if (date === undefined) {
            date = new Date();
        }

        const day   = ("0" + date.getDate()).slice(-2),
            month = ("0" + (date.getMonth() + 1)).slice(-2);

        $("#day").val(date.getFullYear() + "-" + month + "-" + day);
        $("#hour").val(padWithZeros(date.getHours(), 2));
        $("#minute").val(padWithZeros(date.getMinutes(), 2));
        $("#second").val(padWithZeros(date.getSeconds(), 2));
    };

    const toogleWindowButton = function (toPush, toUnpush) {

        /* Untoggled pushed button */
        if (toUnpush !== undefined) {
            $("#window_table tr").eq(0).find("td").eq(toUnpush)[0].className = "unpushed";
        }

        if (toPush !== undefined) {
            $("#window_table tr").eq(0).find("td").eq(toPush)[0].className = "pushed";
        }
    };

    const enableLoading = function () {
        $(".lds-ellipsis").css("display", "inline-block");
    };

    const disableLoading = function () {
        $(".lds-ellipsis").css("display", "none");
    };

    const showWarning = function () {

        $("#obs").fadeIn().delay(5000).fadeOut();
    };

    const hideWarning = function () {

        $("#obs").fadeOut();
    };

    const getTimedate = function () {

        const date    = $("#day").val().split("-"),
            day     = parseInt(date[2]),
            month   = parseInt(date[1]) - 1,
            year    = parseInt(date[0]),
            hours   = parseInt($("#hour").val()),
            minutes = parseInt($("#minute").val()),
            seconds = parseInt($("#second").val());

        return new Date(year, month, day, hours, minutes, seconds, 0);
    };

    const disableDate = function () {

        $("#day").prop("disabled", true);
        $("#hour").prop("disabled", true);
        $("#minute").prop("disabled", true);
        $("#second").prop("disabled", true);
    };

    const enableDate = function () {

        $("#day").prop("disabled", false);
        $("#hour").prop("disabled", false);
        $("#minute").prop("disabled", false);
        $("#second").prop("disabled", false);
    };

    const toogleSearchWarning = function (warning) {

        $("#warning h4").text(warning);

        showSearchWarning();

        const timer = setInterval(function () {

            hideSearchWarning();
            clearInterval(timer);

        }, 5000);

    };

    let checkboxes = [];

    const showSearchResultsAtPage = function (index, data) {

        $("#table_PVs tr").remove();

        checkboxes = [];

        let i;
        let row;
        for (i = index * PV_MAX_ROW_PER_PAGE * PV_PER_ROW; i < data.length && i < ((index + 1) * PV_MAX_ROW_PER_PAGE * PV_PER_ROW); i++) {

            if (!((i - index * PV_MAX_ROW_PER_PAGE * PV_PER_ROW) % PV_PER_ROW)) {
                row = $("<tr></tr>");
                row.appendTo($("#table_PVs"));
            }

            const tdCheckbox = $("<td></td>");

            checkboxes.push($("<input />").attr({"type": "checkbox", "checked": selectedPVs.indexOf(data[i]) > -1}).click({"name": data[i]}, function (event) {
                if (this.checked) {
                    selectedPVs.push(event.data.name);
                } else {
                    selectedPVs.splice(selectedPVs.indexOf(event.data.name), 1);
                }

            }).appendTo(tdCheckbox));

            $("<label></label>").text(data[i]).appendTo(tdCheckbox);

            tdCheckbox.appendTo(row);
        }
    };

    const selectedAllPVs = function (e) {

        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].prop("checked", true).triggerHandler("click");
        }
    };

    const deselectedAllPVs = function (e) {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].prop("checked", false).triggerHandler("click");
        }
    };

    const showSearchResults = function (data) {

        if (data != null && data.length > 0) {
            if (data.length > 1) {
                $("#archived_PVs h2").text(data.length + " PVs have been found.");
            } else {
                $("#archived_PVs h2").text("1 PV has been found.");
            }

            currentPage = 0;
            selectedPVs = [];

            showSearchResultsAtPage(0, data);

            $(document.body).children().css("opacity", "0.3");
            $("#archived_PVs").show();
            $("#archived_PVs").css("opacity", "1.0");

            $("#previous").hide();

            $("#previous").unbind().click({pvs: data}, function (event) {

                currentPage = currentPage - 1;
                showSearchResultsAtPage(currentPage, event.data.pvs);

                if (!currentPage) {
                    $("#previous").hide();
                }

                $("#next").show();
            });

            $("#next").unbind().click({pvs: data}, function (event) {

                currentPage = currentPage + 1;
                showSearchResultsAtPage(currentPage, event.data.pvs);

                if ((currentPage + 1) * PV_MAX_ROW_PER_PAGE * PV_PER_ROW >= event.data.pvs.length) {
                    $("#next").hide();
                }

                $("#previous").show();
            });

            if (data.length <= PV_MAX_ROW_PER_PAGE * PV_PER_ROW) {
                $("#next").hide();
            } else {
                $("#next").show();
            }
        } else if (data != null) {
            toogleSearchWarning("No PVs corresponding to the search string have been found.");
        }
    };

    const hideSearchedPVs = function () {

        $("#archived_PVs").hide();
        $(document.body).children().css("opacity", "1.0");
    };

    const toggleZoomButton = function (enable) {
        if (enable) {
            $("#date .zoom").css("background-color", "lightgrey");
        } else {
            $("#date .zoom").css("background-color", "grey");
        }
    };

    const hideZoomBox = function () {
        $("#canvas_area span.selection_box").hide();
        $("#canvas_area span.selection_box").css("width", 0);
        $("#canvas_area span.selection_box").css("height", 0);
    };

    const drawZoomBox = function (x, w, h) {

        $("#canvas_area span.selection_box").css("left", x + "px");
        $("#canvas_area span.selection_box").css("top", "0");
        $("#canvas_area span.selection_box").css("width", w + "px");
        $("#canvas_area span.selection_box").css("height", h  + "px");
    };

    const updateAddress = function (searchString) {
        const newurl = window.location.pathname + searchString;
        if (history.pushState) {
            window.history.pushState({path: newurl}, "", newurl);
        }
    };

    /**
    * updateDataTable draws a table below the char containing the data that is
    * currently being rendered.
    **/
    const updateDataTable = function (datasets, start, end) {

        // Remove all data before rewriting
        $("#data_table_area .data_table").remove();
        $("#data_table_area h2").remove();

        // Draws a table for each variable chosen by the user
        for (let i = 0; i < datasets.length; i++) {

            const table = $("<table></table>").addClass("data_table");
            const pvData = datasets[i].data;
            let count = 0;

            $("#data_table_area").append($("<h2></h2>").text(datasets[i].label));

            let row;
            for (let j = 0; j < pvData.length; j++) {
                if ((pvData[j].x.getTime() >= start.getTime()) &&
                    (pvData[j].x.getTime() <= end.getTime())) {

                    if (!(count % PV_PER_ROW_DATA_TABLE)) {
                        row = $("<tr></tr>");
                        row.appendTo(table);
                    }

                    count++;

                    $("<td></td>").attr("class", "pv_time").text(pvData[j].x.toLocaleDateString() + " " + pvData[j].x.toLocaleTimeString()).appendTo(row);
                    $("<td></td>").attr("class", "pv_value").text(pvData[j].y.toFixed(datasets[i].pv.precision)).appendTo(row);
                }
            }

            $("#data_table_area").append(table);
        }
    };

    const showTable = function () {
        $("#data_table_area .data_table").show();
    };

    const resetTable = function () {
        $("#data_table_area .data_table").remove();
        $("#data_table_area h2").remove();
        $("#data_table_area .data_table").hide();
    };

    const updateDataAxisInfoTable = (series, toggleChartAxisTypeHandler, toggleAutoYHandler, changeYLimitHandler) =>{
        let row;
        $("#data_axis .data_axis_table").remove();
        const table = $("<table></table>").addClass("data_axis_table");

        if (series.length < 1) {
            return;
        }

        // Draw a table containing each series in the chart.
        for (let i = 0; i < series.length; i++) {

            if (!(i % PV_PER_ROW_INFO)) {
                row = $("<tr></tr>");
                row.appendTo(table);
            }

            $("<td></td>")
                .text("Chart Series: " + series[i].id).appendTo(row);

            const wrapper = $('<div class="footer-box-wrapper"></div>');
            let tdIsLogarithmic = $('<td class="footer-box"></td>');
            let chkBoxBase = $("<label></label>");
            const isManual = !isNaN(series[i].ticks.max) || !isNaN(series[i].ticks.min);

            const intervalMin = $("<input />")
                .attr({
                    "class": "footer-input",
                    "type": "text",
                    "placeholder": "Min",
                    "value": isManual ? series[i].ticks.min : ""
                })
                .blur({"axisId": series[i].id}, changeYLimitHandler)
                .appendTo(row);

            const intervalMax = $("<input />")
                .attr({
                    "class": "footer-input",
                    "type": "text",
                    "placeholder": "Max",
                    "value": isManual ? series[i].ticks.max : ""
                })
                .blur({"axisId": series[i].id}, changeYLimitHandler)
                .appendTo(row);
            if (!isManual) {
                intervalMax.hide();
                intervalMin.hide();
            }

            const chkAutoY = $("<input />")
                .attr({
                    "type": "checkbox",
                    "checked": isManual
                })
                .click({"axisId": series[i].id}, toggleAutoYHandler)
                .appendTo(chkBoxBase);

            const chkAutoYText = $("<span></span>")
                .attr("class", "tooltip")
                .text("Manual Y Limit")
                .appendTo(chkBoxBase);

            chkBoxBase.appendTo(tdIsLogarithmic);
            tdIsLogarithmic.appendTo(wrapper);

            tdIsLogarithmic = $('<td class="footer-box"></td>');
            chkBoxBase = $("<label></label>");

            const chk = $("<input />")
                .attr({
                    "type": "checkbox",
                    "checked": series[i].type !== "linear"
                })
                .click({"axisId": series[i].id}, toggleChartAxisTypeHandler)
                .appendTo(chkBoxBase);

            const chkText = $("<span></span>")
                .attr("class", "tooltip")
                .text("Log Y Axis")
                .appendTo(chkBoxBase);

            chkBoxBase.appendTo(tdIsLogarithmic);
            tdIsLogarithmic.appendTo(wrapper);

            wrapper.appendTo(row);
        }
        $("#data_axis").append(table);
    };

    const updatePVInfoTable = function (datasets, legendHandler, optimizeHandler, removeHandler) {
        let row;
        // Remove all data before rewriting
        $("#data_pv_info .pv_info_table").remove();
        const table = $("<table></table>").addClass("pv_info_table");
        // Draws a table for each variable chosen by the user
        for (let i = 0; i < datasets.length; i++) {

            if (!(i % PV_PER_ROW_INFO)) {
                row = $("<tr></tr>");
                row.appendTo(table);
            }

            $("<td></td>").css({"background-color": datasets[i].backgroundColor, "width": "30px", "cursor": "pointer"}).click({"datasetIndex": i}, legendHandler).appendTo(row);
            $("<td></td>").text(datasets[i].label).appendTo(row);

            const tdOptimized = $("<td></td>");
            $("<input />")
                .attr({"type": "checkbox", "checked": datasets[i].pv.optimized, "disabled": datasets[i].pv.type === "DBR_SCALAR_ENUM"}).click({"datasetIndex": i}, optimizeHandler).appendTo(tdOptimized);

            const div = $("<label></label>")
                .attr("class", "tooltip")
                .text("Optimize");
            $("<span></span>")
                .attr("class", "tooltiptext")
                .text("Uncheck it if you want raw data sent from the server.")
                .appendTo(div);
            div.appendTo(tdOptimized);
            tdOptimized.appendTo(row);

            const tdRemove = $("<td></td>");
            tdRemove
                .css({"cursor": "pointer"})
                .text("Remove")
                .click({"datasetIndex": i}, removeHandler);
            tdRemove.appendTo(row);
        }

        $("#data_pv_info").append(table);
    };

    const showSearchWarning = function () {
        $("#warning").fadeIn();
    };

    const hideSearchWarning = function () {
        $("#warning").fadeOut();
    };

    const disable = function (button) {
        button.addClass("disabled");
        button.css({"background-color": "lightblue", "cursor": "default", "pointerEvents": "none"});
    };

    const enable = function (button) {
        button.removeClass("disabled");
        button.css({"background-color": "grey", "cursor": "pointer", "pointerEvents": "auto"});
    };

/*    var isEndSelected = function () {
        return ($('#date .type').find(":selected").text() == "END");
    };
*/
    const enableReference = function (i) {
        $("#date .type>option:eq(" + (1 - i) + ")").prop("selected", false);
        $("#date .type>option:eq(" + i + ")").prop("selected", true);
    };

    return {

        selectedPVs: function () {
            return selectedPVs;
        },

        updateDataAxisInfoTable: updateDataAxisInfoTable,
        updateDateComponents: updateDateComponents,
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
        toggleZoomButton: toggleZoomButton,
        hideZoomBox: hideZoomBox,
        drawZoomBox: drawZoomBox,
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
//        isEndSelected: isEndSelected,
        enableReference: enableReference,
        selectedAllPVs: selectedAllPVs,
        deselectedAllPVs: deselectedAllPVs,
    };

})();
