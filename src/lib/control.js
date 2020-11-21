/* eslint-disable radix */
/** ***** Time window control functions *******/
/**
 * The following functions control the start and end time that will be plotted on the graph.
 * end stands for the most recent time, meanwhile start
 * stands for the beginning of the window time.
 */
/* require archInterface, chartUtils */

/* Module dependencies */
import archInterface from "./archInterface.js";

import ui from "./ui.js";
import chartUtils, { getDatasetIndex, hideDatasetByLabel, findAxisIndexById } from "./chartUtils.js";
import handlers from "./handlers.js";

import {
  setAutoScroll,
  setDatasetOptimized,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setTimeStart,
  setWindowTime,
  setZooming,
  removeDataset as storeRemoveDataset,
} from "../features/chart/sliceChart";

import store from "../store";

const STACK_ACTIONS = {
  REMOVE_PV: 0,
  APPEND_PV: 1,
  CHANGE_WINDOW_TIME: 2,
  CHANGE_END_TIME: 3,
  CHANGE_START_TIME: 4,
  ZOOM: 5,
};

const REFERENCE = {
  START: false,
  END: true,
};

/* chartjs instance reference */
let chart = null;

/* start and end timedates */
const setStart = (time) => store.dispatch(setTimeStart(time.toString()));
const getStart = () => new Date(store.getState().chart.timeStart);

const setEnd = (time) => store.dispatch(setTimeEnd(time.toString()));
const getEnd = () => new Date(store.getState().chart.timeEnd);

let start;
let end;
let reference = REFERENCE.END; // Reference time end

let windowTime = chartUtils.timeIDs.MIN10;

function updateTimeWindowOnly(time) {
  windowTime = time;
  store.dispatch(setWindowTime(windowTime));
}

let timer = null;

/* Control flags */
let autoEnabled = false;
function setAutoEnabled(enabled) {
  autoEnabled = enabled;
  store.dispatch(setAutoScroll(autoEnabled));
}

let singleTipEnabled = true;
function getSingleTipEnabled() {
  return singleTipEnabled;
}
function setSingleTipEnabled(enabled) {
  singleTipEnabled = enabled;
  store.dispatch(setSingleTooltip(singleTipEnabled));
}

let scrollingEnabled = true;
let serverDateEnabled = true;

let cachedDate = new Date();
let lastFetch = 0;

const dragFlags = {
  dragStarted: false,
  updateOnComplete: true,
};

const zoomFlags = {
  isZooming: false,
  hasBegan: false,
};

const undoStack = [];
const redoStack = [];

const init = function (c) {
  chart = c;
};

const originalGetPixelForValue = Chart.scaleService.constructors.linear.prototype.getPixelForValue;
Chart.scaleService.constructors.linear.prototype.getPixelForValue = function (value) {
  const pixel = originalGetPixelForValue.call(this, value);
  return Math.min(2147483647, Math.max(-2147483647, pixel));
};

const parentEventHandler = Chart.Controller.prototype.eventHandler;
Chart.Controller.prototype.eventHandler = function () {
  // This is not a duplicate of the cursor positioner, this handler is called when a tooltip's datapoint index does not change.
  const ret = parentEventHandler.apply(this, arguments);

  if (!singleTipEnabled) {
    const x = arguments[0].x;
    // const y = arguments[0].y;
    this.clear();
    this.draw();
    const yScale = this.scales["y-axis-0"];
    this.chart.ctx.beginPath();
    this.chart.ctx.moveTo(x, yScale.getPixelForValue(yScale.max));
    this.chart.ctx.strokeStyle = "#ff0000";
    this.chart.ctx.lineTo(x, yScale.getPixelForValue(yScale.min));
    this.chart.ctx.stroke();
  }

  this.tooltip.width = this.tooltip._model.width;
  this.tooltip.height = this.tooltip._model.height;

  const coordinates = chartUtils.reboundTooltip(arguments[0].x, arguments[0].y, this.tooltip, 0.5);

  this.tooltip._model.x = coordinates.x;
  this.tooltip._model.y = coordinates.y;

  return ret;
};

export const doSubscriptions = () => {
  store.subscribe(() => {
    /** Chart Min/Max Limits */
    const dataAxis = store.getState().chart.dataAxis;

    dataAxis.forEach(({ id, yLimitManual, yMin, yMax }, idx) => {
      let updateChart = false;

      const i = findAxisIndexById(chart, id);
      if (i === null) return;
      let axis = chart.options.scales.yAxes[i];

      if (!yLimitManual) {
        delete axis.ticks.max;
        delete axis.ticks.min;
        updateChart = true;
      } else {
        if (yMin && (!("min" in axis.ticks) || ("min" in axis.ticks && yMin !== axis.ticks.min))) {
          updateChart = true;
          axis.ticks.min = yMin;
        }
        if (yMax && (!("max" in axis.ticks) || ("max" in axis.ticks && yMax !== axis.ticks.max))) {
          updateChart = true;
          axis.ticks.max = yMax;
        }
      }
      if (updateChart) chart.update();
    });
  });
};
async function updateTimeWindow(window) {
  updateTimeWindowOnly(window);

  if (windowTime < chartUtils.timeIDs.MIN_30) {
    if (autoEnabled) {
      setAutoEnabled(false);
      clearInterval(timer);
    }
  }

  if (reference === REFERENCE.END) {
    start = new Date(end.getTime() - chartUtils.timeAxisPreferences[windowTime].milliseconds);
  } else if (reference === REFERENCE.START) {
    const now = await getDateNow();

    if (start.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds <= now.getTime()) {
      end = new Date(start.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds);
    } else {
      end = now;
    }
  }

  optimizeAllGraphs();
  updateAllPlots(true);
  updateURL();
  chartUtils.updateTimeAxis(
    chart,
    chartUtils.timeAxisPreferences[windowTime].unit,
    chartUtils.timeAxisPreferences[windowTime].unitStepSize,
    start,
    end
  );

  ui.disableLoading();
}

/**
 * Appends a new variable into the chart.
 **/
async function appendPV(pv, optimized, undo) {
  if (chartUtils.colorStack().length === 0) {
    console.log(`Color stack limit reached. A random color will be used for pv ${pv}.`);
  }

  // Asks for the PV's metadata
  const metadata = await archInterface.fetchMetadata(pv).catch((err) => console.log("Fetch metadata Exception", err));
  if (metadata == null) {
    ui.toogleSearchWarning("Failed to fetch metadata for pv " + pv);
    console.log("No metadata for ", pv);
    return -1;
  }

  let bins = shouldOptimizeRequest(parseFloat(metadata.samplingPeriod), metadata.DBRType);

  if (optimized === false) {
    bins = -1;
  } else if (optimized && bins === -1) {
    bins = chartUtils.timeAxisPreferences[windowTime].bins;
  }
  const data = await archInterface.fetchData(
    pv,
    start,
    end,
    bins < 0 ? false : true,
    bins,
    handlers.handleFetchDataError,
    ui.enableLoading
  );
  if (data === undefined || data === null || data[0].data.length === 0) {
    ui.toogleSearchWarning("No data was received from server.");
    console.log("No data received from server. ", pv);
  } else {
    chartUtils.appendDataset(
      chart,
      improveData(archInterface.parseData(data[0].data)),
      bins,
      parseInt(data[0].meta.PREC) + 1,
      metadata
    );
  }

  updateOptimizedWarning();
  updateURL();

  if (!undo || undo === undefined || undo === null) {
    undoStack.push({ action: STACK_ACTIONS.APPEND_PV, pv: pv });
  }
  ui.disableLoading();
}

/**
 * Checks if the request must optimized because of the variable's data volume. It returns -1 if no optimization is required or the number of bins otherwise.
 **/
const shouldOptimizeRequest = function (samplingPeriod, type) {
  if (type === "DBR_SCALAR_ENUM") {
    return -1;
  }

  /*
    var dataEstimative = chartUtils.timeAxisPreferences[windowTime].milliseconds / (1000 * samplingPeriod);

    if (dataEstimative > DATA_VOLUME_MAX)
        return chartUtils.timeAxisPreferences[windowTime].bins;
    */

  if (windowTime < chartUtils.timeIDs.HOUR2) {
    return chartUtils.timeAxisPreferences[windowTime].bins;
  }

  return -1;
};

/** ***** Update functions *******/
/**
 * The following functions updates the data plotted by the chart. They are called by
 * the event handlers mostly.
 **/

/**
 * Sets end to date and updates start according
 * to the time window size. Updates HTML elements in the case updateHtml is true.
 **/
async function updateStartAndEnd(date, updateHtml, undo) {
  if (date === undefined || date === null) {
    date = new Date();
  }

  if (updateHtml === undefined || updateHtml === null) {
    updateHtml = false;
  }

  const now = await getDateNow();

  if (reference === REFERENCE.END) {
    if (!undo || (undo === undefined) | (undo === null)) {
      undoStack.push({ action: STACK_ACTIONS.CHANGE_END_TIME, endTime: end });
    }

    if (date.getTime() <= now.getTime()) {
      end = date;
    } else {
      end = now;
    }

    start = new Date(end.getTime() - chartUtils.timeAxisPreferences[windowTime].milliseconds);
  } else {
    if (!undo || (undo === undefined) | (undo === null)) {
      undoStack.push({
        action: STACK_ACTIONS.CHANGE_START_TIME,
        startTime: start,
      });
    }

    if (date.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds <= now.getTime()) {
      start = date;
      end = new Date(date.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds);
    } else {
      start = new Date(now.getTime() - chartUtils.timeAxisPreferences[windowTime].milliseconds);
      end = now;
    }
  }

  ui.disableLoading();
}

const updateOptimizedWarning = function () {
  let canOptimize = false;

  for (let i = 0; i < chart.data.datasets.length; i++) {
    canOptimize |= chart.data.datasets[i].pv.optimized;
  }

  // Shows a pleasant warning that the request is fetching optimized data
  if ($("#obs").css("display") !== "block") {
    if (canOptimize) {
      ui.showWarning();
    } else {
      ui.hideWarning();
    }
  }
};

const improveData = function (data) {
  if (data.length > 0) {
    const first = data[0],
      last = data[data.length - 1];

    if (first.x.getTime() > start.getTime()) {
      data.unshift({
        x: start,
        y: first.y,
      });
    }

    if (last.x.getTime() < end.getTime()) {
      data.push({
        x: end,
        y: last.y,
      });
    }
  }

  return data;
};

/**
 * Updates a plot of index pvIndex.
 **/
async function updatePlot(pvIndex) {
  // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
  if (chart.data.datasets[pvIndex].data.length === 0) {
    const bins = chartUtils.timeAxisPreferences[windowTime].bins;

    const fetchedData = await archInterface.fetchData(
      chart.data.datasets[pvIndex].label,
      start,
      end,
      chart.data.datasets[pvIndex].pv.optimized,
      bins,
      handlers.handleFetchDataError,
      ui.enableLoading
    );

    if (fetchedData && fetchedData.length > 0) {
      Array.prototype.push.apply(
        chart.data.datasets[pvIndex].data,
        improveData(archInterface.parseData(fetchedData[0].data))
      );
    }
  } else {
    // Gets the time of the first and last element of the dataset
    const first = chart.data.datasets[pvIndex].data[0].x;
    const last = chart.data.datasets[pvIndex].data[chart.data.datasets[pvIndex].data.length - 1].x;

    // chart.data.datasets[pvIndex].pv.optimized = false;

    // we need to append data to the beginning of the data set
    if (first.getTime() > start.getTime()) {
      // Fetches data from the start to the first measure's time
      let appendData = await archInterface.fetchData(
        chart.data.datasets[pvIndex].label,
        start,
        first,
        false,
        handlers.handleFetchDataError,
        ui.enableLoading
      );

      // Appends new data into the dataset
      if (appendData.length > 0) {
        appendData = appendData[0].data;

        const x = new Date(
          appendData[appendData.length - 1].secs * 1e3 + appendData[appendData.length - 1].nanos * 1e-6
        );

        // Verifies if we are not appending redundant data into the dataset
        while (appendData.length > 0 && x.getTime() >= first.getTime()) {
          appendData.pop(); // remove last element, which is already in the dataset

          if (appendData.length > 0) {
            x.setUTCMilliseconds(
              appendData[appendData.length - 1].secs * 1e3 + appendData[appendData.length - 1].nanos * 1e-6
            );
          }
        }

        Array.prototype.unshift.apply(chart.data.datasets[pvIndex].data, archInterface.parseData(appendData));
      }
    } else {
      // We can remove unnecessary data from the beginning of the dataset to save memory and improve performance
      while (
        chart.data.datasets[pvIndex].data.length > 0 &&
        chart.data.datasets[pvIndex].data[0].x.getTime() < start.getTime()
      ) {
        chart.data.datasets[pvIndex].data.shift();
      }
    }

    // we need to append data to the end of the data set
    if (last.getTime() < end.getTime()) {
      // Fetches data from the last measure's time to the end
      let appendData = await archInterface.fetchData(
        chart.data.datasets[pvIndex].label,
        last,
        end,
        false,
        handlers.handleFetchDataError,
        ui.enableLoading
      );

      // Appends new data into the dataset
      if (appendData.length > 0) {
        appendData = appendData[0].data;

        const x = new Date(appendData[0].secs * 1e3 + appendData[0].nanos * 1e-6);

        // Verifies if we are not appending redundant data into the dataset
        while (appendData.length > 0 && x.getTime() <= last.getTime()) {
          appendData.shift();

          if (appendData.length > 0) {
            x.setUTCMilliseconds(appendData[0].secs * 1e3 + appendData[0].nanos * 1e-6);
          }
        }

        Array.prototype.push.apply(chart.data.datasets[pvIndex].data, archInterface.parseData(appendData));
      }
    } else {
      // We can remove unnecessary data from the end of the dataset to save memory and improve performance
      for (
        let i = chart.data.datasets[pvIndex].data.length - 1;
        chart.data.datasets[pvIndex].data.length > 0 &&
        chart.data.datasets[pvIndex].data[i].x.getTime() > end.getTime();
        i--
      ) {
        chart.data.datasets[pvIndex].data.pop();
      }
    }
    await improveData(chart.data.datasets[pvIndex].data);
  }
}

const optimizeAllGraphs = function () {
  for (let i = 0; i < chart.data.datasets.length; i++) {
    const bins = shouldOptimizeRequest(chart.data.datasets[i].pv.samplingPeriod, chart.data.datasets[i].pv.type);
    const optimized = bins < 0 ? false : true;
    chart.data.datasets[i].pv.optimized = optimized;

    // @todo: update store, center optimization requests.... Consider removing this function
    store.dispatch(setDatasetOptimized({ index: i, optimized: optimized }));
  }
};

/**
 * Updates all plots added so far.
 * @param resets: informs if the user wants to reset the data in the dataset.
 **/
async function updateAllPlots(reset) {
  if (reset === undefined) {
    reset = false;
  }
  updateOptimizedWarning();

  for (let i = 0; i < chart.data.datasets.length; i++) {
    if (chart.data.datasets[i].pv.optimized || reset) {
      chart.data.datasets[i].data.length = 0;
    }
    await updatePlot(i);
  }

  //ui.updatePVInfoTable(chart.data.datasets, hideAxis, optimizeHandler, removeHandler);

  chart.update();
  ui.disableLoading();
}

/**
 * Checks if a PV is already plotted.
 **/
const getPlotIndex = function (pvName) {
  // Iterates over the dataset to check if a pv named pvName exists
  for (let i = 0; i < chart.data.datasets.length; i++) {
    if (chart.data.datasets[i].label === pvName || chart.data.datasets[i].label === decodeURIComponent(pvName)) {
      return i;
    }
  }

  return null;
};

const updateURL = function () {
  let searchString = "?";

  for (let i = 0; i < chart.data.datasets.length; i++) {
    if (chart.data.datasets[i].pv.optimized) {
      searchString +=
        "pv=optimized_" +
        chartUtils.timeAxisPreferences[windowTime].bins +
        "(" +
        encodeURIComponent(chart.data.datasets[i].label) +
        ")&";
    } else {
      searchString += "pv=" + encodeURIComponent(chart.data.datasets[i].label) + "&";
    }
  }

  searchString += "from=" + encodeURIComponent(start.toJSON()) + "&";
  searchString += "to=" + encodeURIComponent(end.toJSON());

  ui.updateAddress(searchString);
};

async function loadFromURL(searchPath) {
  const pvs = [];
  let urlStart = null;
  let urlEnd = null;

  if (searchPath !== "") {
    const searchPaths = searchPath.split("&");

    for (let i = 0; i < searchPaths.length; i++) {
      if (searchPaths[i].indexOf("pv=") !== -1) {
        pvs.push(decodeURIComponent(searchPaths[i].substr(searchPaths[i].indexOf("=") + 1)));
      } else if (searchPaths[i].indexOf("from=") !== -1) {
        urlStart = decodeURIComponent(searchPaths[i].substr(searchPaths[i].indexOf("=") + 1));
      } else if (searchPaths[i].indexOf("to=") !== -1) {
        urlEnd = decodeURIComponent(searchPaths[i].substr(searchPaths[i].indexOf("=") + 1));
      }
    }
  }

  if (urlStart != null && urlEnd != null) {
    start = new Date(urlStart);
    end = new Date(urlEnd);

    let tmpWindowTime = 0;
    tmpWindowTime = 0;
    while (
      end.getTime() - start.getTime() < chartUtils.timeAxisPreferences[tmpWindowTime].milliseconds &&
      tmpWindowTime < chartUtils.timeIDs.SEG_30
    ) {
      tmpWindowTime++;
    }
    updateTimeWindowOnly(tmpWindowTime);
  } else {
    await updateStartAndEnd(new Date(), true);
  }

  chartUtils.updateTimeAxis(
    chart,
    chartUtils.timeAxisPreferences[windowTime].unit,
    chartUtils.timeAxisPreferences[windowTime].unitStepSize,
    start,
    end
  );

  for (let i = 0; i < pvs.length; i++) {
    let optimized = false;

    if (pvs[i].indexOf("optimized_") !== -1) {
      pvs[i] = pvs[i].substr(pvs[i].indexOf("(") + 1);
      pvs[i] = pvs[i].substr(0, pvs[i].indexOf(")"));
      optimized = true;
    }

    appendPV(pvs[i], optimized);
  }

  const singleTipCookie = getCookie("singleTip");

  setSingleTipEnabled(singleTipCookie === "true" || singleTipCookie == null);

  chartUtils.toggleTooltipBehavior(chart, singleTipEnabled);
  chart.update(0, false);
}

function getCookie(name) {
  const cookieArr = document.cookie.split(";");

  for (let i = 0; i < cookieArr.length; i++) {
    const cookiePair = cookieArr[i].split("=");
    if (name === cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }

  return null;
}

async function getDateNow() {
  if (!serverDateEnabled) {
    return new Date();
  }
  if (new Date() - lastFetch < 0) {
    lastFetch = new Date();
  }
  if (new Date() - lastFetch < 2000) {
    return cachedDate;
  }
  try {
    const result = await $.ajax({
      url: archInterface.bypassUrl() + "/date",
      timeout: 300,
    });
    const currentTime = result === undefined ? new Date() : new Date(result);

    cachedDate = currentTime;
    lastFetch = new Date();
    return currentTime;
  } catch (e) {
    console.log("Date retrieval failed. Using local date.");
    serverDateEnabled = false;
    return new Date();
  }
}

const optimizePlot = async function (datasetIndex, optimize) {
  chart.data.datasets[datasetIndex].pv.optimized = optimize;
  chart.data.datasets[datasetIndex].data.length = 0;

  await updatePlot(datasetIndex)
    .then((e) => {
      ui.disableLoading();
      updateURL();
      chart.update();
      console.log("Plot update at index", datasetIndex);
    })
    .catch((e) => {
      console.log("Failed to update plot at index ", datasetIndex);
    });
  store.dispatch(setDatasetOptimized({ index: datasetIndex, optimized: optimize }));
};

const removeDataset = function (datasetIndex, undo) {
  console.log("Remove index", datasetIndex, chart.data.datasets);
  chartUtils.yAxisUseCounter()[chart.data.datasets[datasetIndex].yAxisID]--;
  chartUtils.colorStack().push(chart.data.datasets[datasetIndex].backgroundColor);

  if (!undo || undo === undefined) {
    undoStack.push({
      action: STACK_ACTIONS.REMOVE_PV,
      pv: chart.data.datasets[datasetIndex].label,
      optimized: chart.data.datasets[datasetIndex].pv.optimized,
    });
  }

  const yAxis = chart.data.datasets[datasetIndex].yAxisID;
  const yAxisUseCount = chartUtils.yAxisUseCounter()[yAxis];

  if (yAxisUseCount === 0) {
    console.log("Removing Axis");
    delete chartUtils.yAxisUseCounter()[yAxis];
    chart.scales[yAxis].options.display = false;
    chartUtils.updateAxisPositionLeft(chart.scales[yAxis].position === "left");
    delete chart.scales[yAxis];

    for (let i = 1; i < chart.options.scales.yAxes.length; i++) {
      if (chart.options.scales.yAxes[i].id === yAxis) {
        chart.options.scales.yAxes.splice(i, 1);
        // @todo: update store, series removed
        break;
      }
    }
  }

  chart.data.datasets.splice(datasetIndex, 1);
  //console.log("Removed index", datasetIndex,chart.data.datasets);
  chart.update(0);
  updateURL();
  updateOptimizedWarning();
  // @todo: update store, dataset removed
  store.dispatch(storeRemoveDataset(datasetIndex));
};

const hideAxis = function (event) {
  chartUtils.hidesAxis(chart.getDatasetMeta(event.data.datasetIndex), chart);
  chart.update(0, false);
};

export const toggleAxisType = (axisId) => chartUtils.toggleAxisType(chart, axisId);
export const toggleAutoY = (axisId) => chartUtils.toggleAutoY(chart, axisId);
export const hideDataset = (label) => hideDatasetByLabel(label, chart);
export const optimizeDataset = async (label, optimize) => await optimizePlot(getDatasetIndex(label, chart), optimize);
export const removeDatasetByLabel = (label) => removeDataset(getDatasetIndex(label, chart));
const optimizeHandler = async function (event) {
  await optimizePlot(event.data.datasetIndex, this.checked);
};

export default {
  /* const references */
  stackActions: STACK_ACTIONS,
  references: REFERENCE,

  /* Getters */
  chart: function () {
    return chart;
  },
  start: function () {
    return start;
  },
  end: function () {
    return end;
  },
  reference: function () {
    return reference;
  },
  windowTime: function () {
    return windowTime;
  },
  timer: function () {
    return timer;
  },
  autoEnabled: function () {
    return autoEnabled;
  },
  singleTipEnabled: getSingleTipEnabled,
  scrollingEnabled: function () {
    return scrollingEnabled;
  },
  serverDateEnabled: function () {
    return serverDateEnabled;
  },
  dragFlags: function () {
    return dragFlags;
  },
  zoomFlags: function () {
    return zoomFlags;
  },
  undoStack: function () {
    return undoStack;
  },
  redoStack: function () {
    return redoStack;
  },

  getWindowTime: function () {
    return windowTime;
  },
  getDateNow: getDateNow,

  /* Setters */
  startTimer: function (t) {
    timer = t;
  },

  updateTimeWindow: updateTimeWindow,
  updateTimeWindowOnly: updateTimeWindowOnly,

  updateStartTime: function (s) {
    setStart(s);
    start = s;
  },
  updateEndTime: function (e) {
    setEnd(e);
    end = e;
  },
  updateTimeReference: function (r) {
    reference = r;
    store.dispatch(setTimeReferenceEnd(reference));
  },
  updateStartAndEnd: updateStartAndEnd,

  toggleAuto: function () {
    setAutoEnabled(!autoEnabled);
  },
  toggleSingleTip: function () {
    setSingleTipEnabled(!getSingleTipEnabled());
  },
  disableAuto: function () {
    setAutoEnabled(false);
  },
  disableServerDate: function () {
    serverDateEnabled = false;
  },
  enableAuto: function () {
    setAutoEnabled(true);
  },

  disableScrolling: function () {
    scrollingEnabled = false;
  },
  enableScrolling: function () {
    scrollingEnabled = true;
  },

  startDrag: function () {
    dragFlags.dragStarted = true;
  },
  stopDrag: function () {
    dragFlags.dragStarted = false;
  },
  updateDragEndTime: function (t) {
    dragFlags.endTime = t;
  },
  updateDragOffsetX: function (x) {
    dragFlags.x = x;
  },

  enableZoom: function () {
    zoomFlags.isZooming = true;
    store.dispatch(setZooming(true));
  },
  disableZoom: function () {
    zoomFlags.isZooming = false;
    store.dispatch(setZooming(false));
  },

  init: init,
  appendPV: appendPV,
  shouldOptimizeRequest: shouldOptimizeRequest,
  updateOptimizedWarning: updateOptimizedWarning,
  improveData: improveData,
  updatePlot: updatePlot,
  optimizeAllGraphs: optimizeAllGraphs,
  updateAllPlots: updateAllPlots,
  getPlotIndex: getPlotIndex,
  updateURL: updateURL,
  loadFromURL: loadFromURL,
  removeDataset: removeDataset,
  hideAxis: hideAxis,
  optimizeHandler: optimizeHandler,
};
