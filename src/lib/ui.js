import store from "../store";
import { setLoading } from "../features/chart/sliceChart";

/* eslint-disable radix */
const PV_PER_ROW = 4;
const PV_PER_ROW_DATA_TABLE = 8;
const PV_MAX_ROW_PER_PAGE = 10;
const PV_PER_ROW_INFO = 4;

let currentPage = 0;
let selectedPVs = [];

const toogleWindowButton = (toPush, toUnpush) => {
  /* Untoggled pushed button */
  if (toUnpush !== undefined) {
    $("#window_table tr").eq(0).find("td").eq(toUnpush)[0].className = "unpushed";
  }

  if (toPush !== undefined) {
    $("#window_table tr").eq(0).find("td").eq(toPush)[0].className = "pushed";
  }
};

const enableLoading = () => store.dispatch(setLoading(true));
const disableLoading = () => store.dispatch(setLoading(false));

const showWarning = () => $("#obs").fadeIn().delay(5000).fadeOut();
const hideWarning = () => $("#obs").fadeOut();

const showSearchWarning = () => {
  $("#warning").fadeIn();
};

const hideSearchWarning = () => {
  $("#warning").fadeOut();
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
  for (
    i = index * PV_MAX_ROW_PER_PAGE * PV_PER_ROW;
    i < data.length && i < (index + 1) * PV_MAX_ROW_PER_PAGE * PV_PER_ROW;
    i++
  ) {
    if (!((i - index * PV_MAX_ROW_PER_PAGE * PV_PER_ROW) % PV_PER_ROW)) {
      row = $("<tr></tr>");
      row.appendTo($("#table_PVs"));
    }

    const tdCheckbox = $("<td></td>");

    checkboxes.push(
      $("<input />")
        .attr({
          type: "checkbox",
          checked: selectedPVs.indexOf(data[i]) > -1,
        })
        .click({ name: data[i] }, function (event) {
          if (this.checked) {
            selectedPVs.push(event.data.name);
          } else {
            selectedPVs.splice(selectedPVs.indexOf(event.data.name), 1);
          }
        })
        .appendTo(tdCheckbox)
    );

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

    $("#previous")
      .unbind()
      .click({ pvs: data }, function (event) {
        currentPage = currentPage - 1;
        showSearchResultsAtPage(currentPage, event.data.pvs);

        if (!currentPage) {
          $("#previous").hide();
        }

        $("#next").show();
      });

    $("#next")
      .unbind()
      .click({ pvs: data }, function (event) {
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

const updateAddress = function (searchString) {
  const newurl = window.location.pathname + searchString;
  if (history.pushState) {
    window.history.pushState({ path: newurl }, "", newurl);
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
      if (pvData[j].x.getTime() >= start.getTime() && pvData[j].x.getTime() <= end.getTime()) {
        if (!(count % PV_PER_ROW_DATA_TABLE)) {
          row = $("<tr></tr>");
          row.appendTo(table);
        }

        count++;

        $("<td></td>")
          .attr("class", "pvTime")
          .text(pvData[j].x.toLocaleDateString() + " " + pvData[j].x.toLocaleTimeString())
          .appendTo(row);
        $("<td></td>").attr("class", "pvValue").text(pvData[j].y.toFixed(datasets[i].pv.precision)).appendTo(row);
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

const updateDataAxisInfoTable = (series, toggleChartAxisTypeHandler, toggleAutoYHandler, changeYLimitHandler) => {
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
      .text("Chart Series: " + series[i].id)
      .appendTo(row);

    const wrapper = $('<div class="footer-box-wrapper"></div>');
    let tdIsLogarithmic = $('<td class="footer-box"></td>');
    let chkBoxBase = $("<label></label>");
    const isManual = !isNaN(series[i].ticks.max) || !isNaN(series[i].ticks.min);

    const intervalMin = $("<input />")
      .attr({
        class: "footer-input",
        type: "text",
        placeholder: "Min",
        value: isManual ? series[i].ticks.min : "",
      })
      .blur({ axisId: series[i].id }, changeYLimitHandler)
      .appendTo(row);

    const intervalMax = $("<input />")
      .attr({
        class: "footer-input",
        type: "text",
        placeholder: "Max",
        value: isManual ? series[i].ticks.max : "",
      })
      .blur({ axisId: series[i].id }, changeYLimitHandler)
      .appendTo(row);
    if (!isManual) {
      intervalMax.hide();
      intervalMin.hide();
    }

    const chkAutoY = $("<input />")
      .attr({
        type: "checkbox",
        checked: isManual,
      })
      .click({ axisId: series[i].id }, toggleAutoYHandler)
      .appendTo(chkBoxBase);

    const chkAutoYText = $("<span></span>").attr("class", "tooltip").text("Manual Y Limit").appendTo(chkBoxBase);

    chkBoxBase.appendTo(tdIsLogarithmic);
    tdIsLogarithmic.appendTo(wrapper);

    tdIsLogarithmic = $('<td class="footer-box"></td>');
    chkBoxBase = $("<label></label>");

    const chk = $("<input />")
      .attr({
        type: "checkbox",
        checked: series[i].type !== "linear",
      })
      .click({ axisId: series[i].id }, toggleChartAxisTypeHandler)
      .appendTo(chkBoxBase);

    const chkText = $("<span></span>").attr("class", "tooltip").text("Log Y Axis").appendTo(chkBoxBase);

    chkBoxBase.appendTo(tdIsLogarithmic);
    tdIsLogarithmic.appendTo(wrapper);

    wrapper.appendTo(row);
  }
  $("#data_axis").append(table);
};

export default {
  selectedPVs: () => selectedPVs,
  updateDataAxisInfoTable: updateDataAxisInfoTable,
  toogleWindowButton: toogleWindowButton,
  enableLoading: enableLoading,
  disableLoading: disableLoading,
  showWarning: showWarning,
  hideWarning: hideWarning,
  showSearchResultsAtPage: showSearchResultsAtPage,
  showSearchResults: showSearchResults,
  hideSearchedPVs: hideSearchedPVs,
  updateAddress: updateAddress,
  updateDataTable: updateDataTable,
  showTable: showTable,
  resetTable: resetTable,
  showSearchWarning: showSearchWarning,
  hideSearchWarning: hideSearchWarning,
  toogleSearchWarning: toogleSearchWarning,
  selectedAllPVs: selectedAllPVs,
  deselectedAllPVs: deselectedAllPVs,
};
