/* eslint-disable radix */

import archInterface from "../../data-access";
import chartUtils, { getDatasetIndex, hideDatasetByLabel, findAxisIndexById } from "../../utility/chartUtils";
import { StatusDispatcher } from "../../utility/Dispatchers";
import { StackAction as STACK_ACTIONS } from "../../controllers/ActionsStack/ActionsStackConstants";
import Browser from "../../utility/Browser";
import makeAutoUpdate from "./AutoUpdate";
import store from "../../store";
import {
  setDatasetOptimized,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setTimeStart,
  setWindowTime,
  setZooming,
  setLoading,
  removeDataset as storeRemoveDataset,
} from "../../features/chart/sliceChart";

const REFERENCE = {
  START: false,
  END: true,
};
/* chartjs instance reference */
let chart = null;

/* start and end timedates */
const setStart = (time) => {
  store.dispatch(setTimeStart(time.toString()));
  start = time;
};

const setEnd = (time) => {
  store.dispatch(setTimeEnd(time.toString()));
  end = time;
};

const enableLoading = () => store.dispatch(setLoading(true));
const disableLoading = () => store.dispatch(setLoading(false));

let start;
let end;
let reference = REFERENCE.END; // Reference time end

let windowTime = chartUtils.timeIDs.MIN10;

function updateTimeWindowOnly(time) {
  windowTime = time;
  store.dispatch(setWindowTime(windowTime));
}

/* Control flags */
// -----------------------------------------------------------
const AutoUpdate = makeAutoUpdate(autoUpdateFunction);
function isAutoUpdateEnabled() {
  return AutoUpdate.isEnabled();
}
async function autoUpdateFunction() {
  if (reference === REFERENCE.START) {
    updateTimeReference(REFERENCE.END);
  }

  const now = await getDateNow();

  await updateStartAndEnd(now, true, true);

  chartUtils.updateTimeAxis(
    chart,
    chartUtils.timeAxisPreferences[windowTime].unit,
    chartUtils.timeAxisPreferences[windowTime].unitStepSize,
    start,
    end
  );
  updateURL();
  await updateAllPlots(false);
}
const setAutoUpdateEnabled = () => AutoUpdate.setEnabled();
const setAutoUpdateDisabled = () => AutoUpdate.setDisabled();
const toggleAutoUpdate = (status) => AutoUpdate.toggle();
// -----------------------------------------------------------

const updateTimeReference = (r) => {
  reference = r;
  store.dispatch(setTimeReferenceEnd(reference));
};
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

let cachedDate = null;
let lastFetch = null;

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
  doSubscriptions();
  loadTooltipSettings();
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
      if (i === null) {
        return;
      }
      const axis = chart.options.scales.yAxes[i];

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
      if (updateChart) {
        chart.update();
      }
    });
  });
};
async function updateTimeWindow(window) {
  updateTimeWindowOnly(window);

  if (windowTime < chartUtils.timeIDs.MIN_30) {
    if (isAutoUpdateEnabled()) {
      setAutoUpdateDisabled();
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
}

async function getPVMetadata(pv) {
  // Asks for the PV's metadata
  const metadata = await archInterface
    .fetchMetadata(pv)
    .then((data) => data)
    .catch((e) => {
      const msg = `Failed to fetch metadata for pv ${pv} error ${e}`;
      console.log(msg);
      StatusDispatcher.Error("Fetch metadata failure", msg);
      return null;
    });
  return metadata;
}
/**
 * Appends a new variable into the chart.
 **/
async function appendPV(pv, optimized, undo) {
  if (chartUtils.colorStack().length === 0) {
    console.log(`Color stack limit reached. A random color will be used for pv ${pv}.`);
  }

  const metadata = await getPVMetadata(pv);

  let bins = shouldOptimizeRequest(parseFloat(metadata.samplingPeriod), metadata.DBRType);

  if (optimized === false) {
    bins = -1;
  } else if (optimized && bins === -1) {
    bins = chartUtils.timeAxisPreferences[windowTime].bins;
  }

  // @todo: Enable loading ...
  enableLoading();
  await archInterface
    .fetchData(pv, start, end, bins < 0 ? false : true, bins)
    .then((res) => {
      const {
        meta: { PREC, name },
        data,
      } = res;

      if (res.data.length === 0) {
        const msg = `No data for ${name} was received from server in the interval ${start} to ${end}.`;
        StatusDispatcher.Warning("No data on interval", msg);
      } else {
        chartUtils.appendDataset(chart, improveData(data), bins, parseInt(PREC) + 1, metadata);
      }
    })
    .catch((e) => {
      const msg = `Failure ${e}`;
      console.error(msg);
      StatusDispatcher.Error("Append PV", msg);
    });
  disableLoading();
  // -------------

  updateOptimizedWarning();
  updateURL();

  if (!undo || undo === undefined || undo === null) {
    undoStack.push({ action: STACK_ACTIONS.APPEND_PV, pv: pv });
  }
}
/**
 * Checks if the request must optimized because of the variable's data volume. It returns -1 if no optimization is required or the number of bins otherwise.
 **/
const shouldOptimizeRequest = function (samplingPeriod, type) {
  if (type === "DBR_SCALAR_ENUM") {
    return -1;
  }

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
 * to the time window size.
 **/
async function updateEndTime(date, now) {
  // const end = getEnd();
  let newEnd;
  if (!end) {
    newEnd = date;
    //   end = date;
  }
  if (date.getTime() <= now.getTime()) {
    newEnd = date;
    //   end = date;
  } else {
    newEnd = now;
    //   end = now;
  }
  const newStartDate = new Date(newEnd.getTime() - chartUtils.timeAxisPreferences[windowTime].milliseconds);

  if (newEnd) {
    end = newEnd;
  } // setEnd(newEnd);
  start = newStartDate;
  // setStart(newStartDate);
  // start = new Date(end.getTime() - chartUtils.timeAxisPreferences[windowTime].milliseconds);
}

async function updateStartTime(date, now) {
  // const _start = getStart();
  let newStart;
  let newEnd;

  if (!start) {
    newStart = now;
    // setStart(now);
    //   start = now;
  }
  const isStartDatePlusWindowTimeSmallerThanNow =
    date.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds <= now.getTime();

  if (isStartDatePlusWindowTimeSmallerThanNow) {
    const startDatePlusOffset = new Date(date.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds);

    newStart = date;
    newEnd = startDatePlusOffset;
    // start = date;
    // end = new Date(date.getTime() + chartUtils.timeAxisPreferences[windowTime].milliseconds);
  } else {
    const startDateMinusOffset = new Date(now.getTime() - chartUtils.timeAxisPreferences[windowTime].milliseconds);
    newStart = startDateMinusOffset;
    newEnd = now;
    //   start =
    //  end = now;
  }
  if (newStart) {
    start = newStart;
  }
  if (newEnd) {
    end = newEnd;
  }
  // if (newStart) setStart(newStart);
  // if (newEnd) setEnd(newEnd);
}
async function updateStartAndEnd(date, undo) {
  if (date === undefined || date === null) {
    date = new Date();
  }

  const now = await getDateNow();
  const isEndTime = reference === REFERENCE.END;

  if (isEndTime) {
    if (undo) {
      undoStack.push({ action: STACK_ACTIONS.CHANGE_END_TIME, endTime: end });
    }
    await updateEndTime(date, now);
  } else {
    if (undo) {
      undoStack.push({ action: STACK_ACTIONS.CHANGE_START_TIME, startTime: start });
    }
    await updateStartTime(date, now);
  }
}

const updateOptimizedWarning = function () {
  let canOptimize = false;

  for (let i = 0; i < chart.data.datasets.length; i++) {
    canOptimize |= chart.data.datasets[i].pv.optimized;
  }

  if (canOptimize) {
    const msg =
      "In order to reduce the data amount retrieved from server, an optimization is used. Each point corresponds to an average calculated over its neighborhood.";
    StatusDispatcher.Warning("Data is being optimized", msg);
  }
};

const improveData = function (data) {
  // WHY!?!

  const unshiftData = [];
  if (data.length > 0) {
    const first = data[0];
    const last = data[data.length - 1];

    if (first.x.getTime() > start.getTime()) {
      unshiftData.push({
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
  data.unshift(...unshiftData);
  return data;
};

const datasetLatestFetchRequestTime = {};
/**
 * Updates a plot of index pvIndex.
 **/

async function updateEmptyDataset(datasetIndex, dataset) {
  const bins = chartUtils.timeAxisPreferences[windowTime].bins;

  const thisDatasetRequestTime = new Date().getTime();
  datasetLatestFetchRequestTime[datasetIndex] = thisDatasetRequestTime;

  // @todo: Enable loading
  await archInterface
    .fetchData(dataset.label, start, end, dataset.pv.optimized, bins)
    .then((res) => {
      const { data } = res;
      const isTheLatestFetchRequest = datasetLatestFetchRequestTime[datasetIndex] === thisDatasetRequestTime;

      if (isTheLatestFetchRequest) {
        if (data.length > 0) {
          Array.prototype.push.apply(dataset.data, improveData(data));
        }
        datasetLatestFetchRequestTime[datasetIndex] = null;
      }
    })
    .catch((e) => {
      const msg = `Failed to fetch ${dataset.label} data, error ${e}`;
      StatusDispatcher.Error("Archiver data acquisition", msg);
      console.error(msg);
    });
}

async function updatePlot(datasetIndex) {
  // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
  const dataset = chart.data.datasets[datasetIndex];
  if (dataset.data.length === 0) {
    return await updateEmptyDataset(datasetIndex, dataset);
  }

  // Gets the time of the first and last element of the dataset
  const first = dataset.data[0].x;
  const last = dataset.data[dataset.data.length - 1].x;

  const trimDatasetStart = () => {
    while (dataset.data.length > 0 && dataset.data[0].x.getTime() < start.getTime()) {
      dataset.data.shift();
    }
  };

  const trimDatasetEnd = () => {
    for (let i = dataset.data.length - 1; dataset.data.length > 0 && dataset.data[i].x.getTime() > end.getTime(); i--) {
      dataset.data.pop();
    }
  };

  // we need to append data to the beginning of the data set
  const isFistPointAfterTheStart = first.getTime() > start.getTime();
  if (isFistPointAfterTheStart) {
    // Fetches data from the start to the first measure's time
    await fillDataFromStartFirst(dataset, first);
  } else {
    trimDatasetStart();
  }

  // we need to append data to the end of the data set
  const isLastPointBeforeTheEnd = last.getTime() < end.getTime();
  if (isLastPointBeforeTheEnd) {
    await fillDataFromLastToEnd(dataset, last);
  } else {
    trimDatasetEnd();
  }

  await improveData(dataset.data);
}

const optimizeAllGraphs = function () {
  chart.data.datasets.forEach((dataset, i) => {
    const bins = shouldOptimizeRequest(dataset.pv.samplingPeriod, dataset.pv.type);
    const optimized = bins < 0 ? false : true;
    dataset.pv.optimized = optimized;

    store.dispatch(setDatasetOptimized({ index: i, optimized: optimized }));
  });
};

async function fillDataFromLastToEnd(dataset, last) {
  const pvName = dataset.name;
  await archInterface
    .fetchData(pvName, last, end, false)
    .then((res) => {
      const { data } = res;

      // Appends new data into the dataset
      if (data.length > 0) {
        let fistPointDate = data[0].x;
        // Verifies if we are not appending redundant data into the dataset
        while (data.length > 0 && fistPointDate.getTime() <= last.getTime()) {
          data.shift();
          if (data.length > 0) {
            fistPointDate = data[0].x;
          }
        }
        dataset.data.push(data);
      }
    })
    .catch((e) => {
      const msg = `Failed to fill data from ${pvName} [${last} to ${end}], error ${e}`;
      console.error(msg);
      StatusDispatcher.Error("Fetch data", msg);
    });
}

async function fillDataFromStartFirst(dataset, first) {
  const pvName = dataset.label;
  await archInterface
    .fetchData(dataset.label, start, first, false)
    .then((res) => {
      const { data } = res;
      // Appends new data into the dataset
      if (data.length > 0) {
        let firstPointDate = data[0].x;

        // Verifies if we are not appending redundant data into the dataset
        while (data.length > 0 && firstPointDate.getTime() >= first.getTime()) {
          data.pop(); // remove last element, which is already in the dataset

          if (data.length > 0) {
            firstPointDate = data[0].x;
          }
        }
        dataset.data.unshift(data);
      }
    })
    .catch((e) => {
      const msg = `Failed to fill data from ${pvName} [${start} to ${first}], error ${e}`;
      console.error(msg);
      StatusDispatcher.Error("Fill data", msg);
    });
}

/**
 * Updates all plots added so far.
 * @param resets: informs if the user wants to reset the data in the dataset.
 **/
async function updateAllPlots(reset) {
  //  enableLoading();
  if (reset === undefined) {
    reset = false;
  }
  updateOptimizedWarning();

  const promisses = chart.data.datasets.map(async (dataset, i) => {
    if (dataset.pv.optimized || reset) {
      dataset.data.length = 0;
    }

    await updatePlot(i).then(() => {
      chart.update();
    });
  });

  await Promise.all(promisses)
    /* .then() Handle something? */
    .catch((error) => console.exception(`Failed to update all plots ${error.message}`));
  //   .finally(() => disableLoading());
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
  const { bins } = chartUtils.timeAxisPreferences[windowTime];
  const datasets = chart.data.datasets;
  Browser.updateAddress(datasets, bins, start, end);
};

function getNewTimeWindow() {
  const endTime = end.getTime();
  const startTime = start.getTime();

  const getCurrentWindowTime = (id) => chartUtils.timeAxisPreferences[id].milliseconds;
  const minWindowTime = chartUtils.timeIDs.SEG_30;
  const shouldIncreaseWindow = (idx) => {
    return endTime - startTime < getCurrentWindowTime(idx) && idx < minWindowTime;
  };

  let tmpWindowTime = 0;
  while (shouldIncreaseWindow(tmpWindowTime)) {
    tmpWindowTime++;
  }
  return tmpWindowTime;
}
function loadTooltipSettings() {
  const singleTipCookie = Browser.getCookie("singleTip");

  setSingleTipEnabled(singleTipCookie === "true" || singleTipCookie == null);

  chartUtils.toggleTooltipBehavior(chart, singleTipEnabled);
}
function shouldGetDateFromRemote() {
  const now = new Date();

  if (!lastFetch || !cachedDate) {
    lastFetch = now;
    return true;
  }

  const timeDeltaSeconds = (now.getTime() - lastFetch.getTime()) / 1000;
  if (timeDeltaSeconds > 30) {
    return true;
  }

  return false;
}

async function getDateNow() {
  if (!serverDateEnabled) {
    return new Date();
  }

  if (!shouldGetDateFromRemote()) {
    return cachedDate;
  }

  try {
    const result = await archInterface.getRemoteDate();
    const currentTime = !result ? new Date() : result;

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
      disableLoading();
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
  let removeAxis = null;
  if (yAxisUseCount === 0) {
    console.log("Removing Axis");
    delete chartUtils.yAxisUseCounter()[yAxis];
    chart.scales[yAxis].options.display = false;
    chartUtils.updateAxisPositionLeft(chart.scales[yAxis].position === "left");
    delete chart.scales[yAxis];

    for (let i = 1; i < chart.options.scales.yAxes.length; i++) {
      if (chart.options.scales.yAxes[i].id === yAxis) {
        chart.options.scales.yAxes.splice(i, 1);
        removeAxis = yAxis;
        break;
      }
    }
  }

  chart.data.datasets.splice(datasetIndex, 1);
  chart.update(0);
  updateURL();
  updateOptimizedWarning();

  store.dispatch(storeRemoveDataset({ idx: datasetIndex, removeAxis: removeAxis }));
};

const hideAxis = function (event) {
  chartUtils.hidesAxis(chart.getDatasetMeta(event.data.datasetIndex), chart);
  chart.update(0, false);
};

export const toggleAxisType = (axisId) => chartUtils.toggleAxisType(chart, axisId);
export const toggleAutoY = (axisId) => chartUtils.toggleAutoY(chart, axisId);
export const hideDataset = (label) => hideDatasetByLabel(label, chart);

export const optimizeDataset = async (label, optimize) => {
  const index = getDatasetIndex(label, chart);
  await optimizePlot(index, optimize);
};

export const removeDatasetByLabel = (label) => removeDataset(getDatasetIndex(label, chart));
const optimizeHandler = async function (event) {
  await optimizePlot(event.data.datasetIndex, this.checked);
};

const toggleSingleTooltip = () => {
  setSingleTipEnabled(!getSingleTipEnabled());
  Browser.setCookie("singleTip", getSingleTipEnabled());
  chartUtils.toggleTooltipBehavior(chart, getSingleTipEnabled());
};

export default {
  /* const references */
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
  isAutoUpdateEnabled,
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

  updateTimeWindow: updateTimeWindow,
  updateTimeWindowOnly: updateTimeWindowOnly,

  updateStartTime: function (s) {
    setStart(s);
  },
  updateEndTime: function (e) {
    setEnd(e);
  },
  updateTimeReference,
  updateStartAndEnd: updateStartAndEnd,
  toggleSingleTip: toggleSingleTooltip,
  disableServerDate: function () {
    serverDateEnabled = false;
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
  enableLoading: enableLoading,
  disableLoading: disableLoading,
  toggleAutoUpdate: toggleAutoUpdate,
  appendPV: appendPV,
  shouldOptimizeRequest: shouldOptimizeRequest,
  updateOptimizedWarning: updateOptimizedWarning,
  improveData: improveData,
  updatePlot: updatePlot,
  optimizeAllGraphs: optimizeAllGraphs,
  updateAllPlots: updateAllPlots,
  getPlotIndex: getPlotIndex,
  updateURL: updateURL,
  removeDataset: removeDataset,
  hideAxis: hideAxis,
  optimizeHandler: optimizeHandler,
  setStart,
  setEnd,
  getNewTimeWindow,
};
