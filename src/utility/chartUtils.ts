/** ***** Chart control functions *******/
import { TIME_AXIS_PREFERENCES, TIME_IDS } from "../lib/timeAxisPreferences";
import { TimeAxisID, TimeAxisIndex } from "./TimeAxis/TimeAxisConstants";
import { colorStack, randomColorGenerator } from "./color";
import { eguNormalize } from "./egu";
import Chart from "chart.js";
import store from "../store";
import { addToDataset, addToDataAxis, setAxisTypeLog, setDatasetVisible } from "../features/chart/sliceChart";

const yAxisUseCounter: any[] = [];

const AxisUseCounter: Map<string, number> = new Map();
function addAxisUseCounter(axisName: string): number {
  let value = AxisUseCounter.get(axisName);
  if (value === undefined) {
    value = 1;
    AxisUseCounter.set(axisName, 1);
  } else {
    value++;
    AxisUseCounter.set(axisName, value);
  }
  return value;
}
function removeAxisUseCounter(axisName: string): number {
  let value = AxisUseCounter.get(axisName);
  if (value === undefined) {
    return 0;
  }
  value--;

  if (value === 0) {
    AxisUseCounter.delete(axisName);
  } else {
    AxisUseCounter.set(axisName, value);
  }

  return value;
}

let axisPositionLeft = true;

/**
 * Updates chart's time axes, but does not updates it by calling update(0, false).
 **/
function updateTimeAxis(chart: any, unit: any, unitStepSize: any, from: Date, to: Date): void {
  chart.options.scales.xAxes[TimeAxisIndex].time.unit = unit;
  chart.options.scales.xAxes[TimeAxisIndex].time.stepSize = unitStepSize;
  chart.options.scales.xAxes[TimeAxisIndex].time.min = from;
  chart.options.scales.xAxes[TimeAxisIndex].time.max = to;
}

/** Custom tick settings for pressure readings */
const tickPressureCallback = (label: any) => {
  switch (label) {
    case 1e-12:
    case 1e-11:
    case 1e-10:
    case 1e-9:
    case 1e-8:
    case 1e-7:
    case 1e-6:
    case 1e-5:
    case 1e-4:
    case 1e-3:
    case 1e-2:
    case 1e-1:
      return label.toExponential(1);
    default:
      return "";
  }
};

const TICK_CALLBACKS_LOG: Map<string, any> = new Map();
TICK_CALLBACKS_LOG.set("mBar", tickPressureCallback);

function getYAxisById(chart: any, axisId: any) {
  if (chart.options.scales.yAxes.length <= 1) {
    return null;
  }
  for (let i = 1; i < chart.options.scales.yAxes.length; i++) {
    if (chart.options.scales.yAxes[i].id === axisId) {
      return chart.options.scales.yAxes[i];
    }
  }
  return null;
}

const toggleAxisType = (chart: any, axisId: string) => {
  const yAxis = getYAxisById(chart, axisId);
  if (yAxis === null) {
    return;
  }

  // Flip the axis type
  const newAxisIsLog = yAxis.type === "linear";

  yAxis.type = newAxisIsLog ? "logarithmic" : "linear";

  if (newAxisIsLog) {
    // Apply specific callback
    yAxis.callback = tickPressureCallback;
    if (axisId in TICK_CALLBACKS_LOG) {
      yAxis.callback = TICK_CALLBACKS_LOG.get(axisId);
    } else {
      delete yAxis.callback;
    }
  } else {
    delete yAxis.callback;
  }
  chart.update();

  // @todo: Move the store access to another place
  store.dispatch(setAxisTypeLog({ id: axisId, isLog: newAxisIsLog }));
};

export const findAxisIndexById = (chart: any, axisId: any) => {
  for (let i = 1; i < chart.options.scales.yAxes.length; i++) {
    if (chart.options.scales.yAxes[i].id === axisId) {
      return i;
    }
  }
  console.error(`Failed to find index of axis ${axisId}`);
  return null;
};

const getAxesInUse = (axes: any) => {
  if (axes == null || axes.length <= 1) {
    return [];
  }

  const axesInUse: any[] = [];
  axes.forEach((element: any) => {
    if (element.id in yAxisUseCounter && yAxisUseCounter[element.id] > 0) {
      axesInUse.push(element);
    }
  });
  return axesInUse;
};

/** Adds a new vertical axis to the chart. */
const appendDataAxis = function (chart: any, nId: any, ticksPrecision: any) {
  if (nId in yAxisUseCounter) {
    /* Increments the number of times this axis is used by a PV. */
    yAxisUseCounter[nId]++;
    return;
  }

  /* yAxisUseCounter[nId] stands for the times this axis is used */
  yAxisUseCounter[nId] = 1;

  if (ticksPrecision === undefined) {
    ticksPrecision = 3;
  }

  // Function which is called when the scale is being drawn.
  const ticksCallback = (value: number) => {
    if (value !== 0 && Math.abs(value) < Math.pow(10, -ticksPrecision)) {
      return value.toExponential(ticksPrecision);
    }
    /* ticksPrecision stands for the number of decimal cases shown by the plot in the vertical axis */
    if (ticksPrecision > 4) {
      return value.toExponential(3);
    }
    return value.toFixed(ticksPrecision);
  };

  const dataAxisSettings = {
    id: nId,
    type: "linear",
    display: true,
    position: axisPositionLeft ? "left" : "right",
    scaleLabel: {
      display: true,
      labelString: nId,
    },
  };
  chart.options.scales.yAxes.push({
    ...dataAxisSettings,
    ticks: {
      callback: ticksCallback,
      minor: {
        display: true,
        labelOffset: 0,
        padding: 0,
      },
    },
  });
  axisPositionLeft = axisPositionLeft ? false : true;
  chart.update();

  // @todo: Append to data Axis
  store.dispatch(addToDataAxis(dataAxisSettings));
};

const appendDataset = function (chart: any, data: any, bins: any, precision: any, metadata: any) {
  const samplingPeriod = parseFloat(metadata.samplingPeriod);
  const pvName = metadata.pvName;
  const desc = metadata.DESC;
  const type = metadata.DBRType;
  const unit = eguNormalize(metadata.EGU, metadata.pvName);

  // Parses the data fetched from the archiver the way that the chart's internal classes can plot
  const color = colorStack.length > 0 ? colorStack.pop() : randomColorGenerator();

  // Adds a new vertical axis if no other with the same unit exists
  appendDataAxis(chart, unit, precision);

  // Pushes it into the chart
  // @todo: Update the store at control.js
  const newDatasetInfo = {
    label: pvName,
    yAxisID: unit,
    backgroundColor: color,
    borderColor: color,
    pv: {
      precision: precision,
      type: type,
      samplingPeriod: samplingPeriod,
      optimized: bins < 0 ? false : true,
      desc: desc,
      egu: unit,
      metadata: metadata,
    },
  };

  chart.data.datasets.push({
    ...newDatasetInfo,
    xAxisID: TimeAxisID,
    borderWidth: 1.5,
    data: data,
    fill: false,
    pointRadius: 0,
    showLine: true,
    steppedLine: true,
  });
  chart.update();

  store.dispatch(
    addToDataset({
      visible: true,
      ...newDatasetInfo,
      pv: {
        ...newDatasetInfo.pv,
      },
    })
  );
};

/** Hide a dataset by it's label */
export function hideDatasetByLabel(datasetIndex: number, chart: any) {
  // Update visibility status
  const meta = chart.getDatasetMeta(datasetIndex);
  const { yAxisID } = meta;

  if (meta.hidden) {
    meta.hidden = false;
    yAxisUseCounter[yAxisID]++;
    chart.scales[yAxisID].options.display = true;
  } else {
    meta.hidden = true;
    yAxisUseCounter[yAxisID]--;
    if (yAxisUseCounter[yAxisID] <= 0) {
      /* If there are no more datasets using the axis, hide it*/
      chart.scales[yAxisID].options.display = false;
    }
  }
  chart.update(0, false);
  // @todo: Update store at control.js
  store.dispatch(setDatasetVisible({ index: datasetIndex, visible: !meta.hidden }));
}

function hidesAxis(metadata: any, chart: any) {
  if (metadata.hidden) {
    yAxisUseCounter[metadata.yAxisID]++;
    chart.scales[metadata.yAxisID].options.display = true;
    metadata.hidden = false;
  } else {
    metadata.hidden = true;
    yAxisUseCounter[metadata.yAxisID]--;
    if (yAxisUseCounter[metadata.yAxisID] <= 0) {
      chart.scales[metadata.yAxisID].options.display = false;
    }
  }
}

/**
 * Decides if a y axis should be displayed or not.
 **/
const legendCallback = function (e: any, legendItem: any) {
  const meta = this.chart.getDatasetMeta(legendItem.datasetIndex);

  hidesAxis(meta, this.chart);

  this.chart.update(0, false);
};

/**
 * Edits tooltip's label before printing them in the screen.
 **/
const labelCallback = function (label: any, chart: any) {
  const pvPrecision = chart.datasets[label.datasetIndex].pv.precision;
  const labelText = chart.datasets[label.datasetIndex].label;
  const value = label.yLabel;

  let displayValue = "";

  if (pvPrecision > 4) {
    displayValue = value.toExponential(3);
  } else if (value !== 0 && Math.abs(value) < Math.pow(10, -pvPrecision)) {
    displayValue = value.toExponential(Math.min(3, pvPrecision));
  } else {
    displayValue = value.toExponential(pvPrecision);
  }

  return `${labelText}: ${displayValue}`;
};

function toggleTooltipBehavior(chart: any, isSingleTooltipEnabled: boolean) {
  if (isSingleTooltipEnabled) {
    chart.options.tooltips.position = "nearest";
    chart.options.tooltips.mode = "nearest";
    chart.options.tooltips.caretSize = 5;
    delete chart.options.tooltips.yAlign;
    delete chart.options.tooltips.xAlign;
    delete chart.options.tooltips.axis;
    chart.options.elements.point.hoverRadius = 5;
  } else {
    chart.options.tooltips.position = "cursor";
    chart.options.tooltips.mode = "nearest";
    chart.options.tooltips.caretSize = 0;
    chart.options.tooltips.yAlign = "no-transform";
    chart.options.tooltips.xAlign = "no-transform";
    chart.options.tooltips.axis = "x";
    chart.options.elements.point.hoverRadius = 0;
  }

  chart.update();
}

const reboundTooltip = (x: any, y: any, tooltip: any, factor: any): any => {
  const tooltipWidth = tooltip.width;
  const tooltipHeight = tooltip.height;
  const coordinates = { x: 0, y: y };

  if (x > tooltip._chart.width - (tooltipWidth + 10)) {
    coordinates.x = x - tooltipWidth - 5;
  } else {
    coordinates.x = x + 5;
  }
  coordinates.y = y - tooltipHeight * factor + 5;

  return coordinates;
};

Chart.Tooltip.positioners.cursor = function (chartElements, coordinates) {
  // This exists to override default Chartjs behavior. It does not cause the whole tooltip element to be rerendered.
  // As yAlign and xAlign properties are set to 'no-transform', we have to give an absolute position for the tooltip, this occurs in conjunction with the eventHandler in control.js.
  return reboundTooltip(coordinates.x, coordinates.y, this, 0);
};

export default {
  /* const references */
  timeAxisID: TimeAxisID,
  timeAxisPreferences: TIME_AXIS_PREFERENCES,
  timeIDs: TIME_IDS,

  /* Getters */
  getAxesInUse: getAxesInUse,
  yAxisUseCounter: (): any => yAxisUseCounter,
  colorStack: (): any => colorStack,
  axisPositionLeft: (): any => axisPositionLeft,

  /* Setters */
  toggleTooltipBehavior,
  updateAxisPositionLeft: (a: any): any => {
    axisPositionLeft = a;
  },
  toggleAxisType,
  updateTimeAxis,
  appendDataAxis,
  appendDataset,
  hidesAxis,
  legendCallback,
  labelCallback,
  reboundTooltip,
  randomColorGenerator,
};
