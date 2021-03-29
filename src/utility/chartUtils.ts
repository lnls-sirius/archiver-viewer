/** ***** Chart control functions *******/
import { TIME_AXIS_PREFERENCES, TIME_IDS } from "../lib/timeAxisPreferences";
import { TimeAxisID } from "./TimeAxis/TimeAxisConstants";
import Chart from "chart.js";

export const DefaultBinSize = 800;

/** Custom tick settings for pressure readings */
function tickPressureCallback(label: any) {
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
}

const TICK_CALLBACKS_LOG: Map<string, any> = new Map();
TICK_CALLBACKS_LOG.set("mBar", tickPressureCallback);

export function findAxisIndexById(chart: Chart, axisId: string): number {
  for (let i = 1; i < chart.options.scales.yAxes.length; i++) {
    if (chart.options.scales.yAxes[i].id === axisId) {
      return i;
    }
  }
  console.error(`Failed to find index of axis ${axisId}`);
  return null;
}

function reboundTooltip(x: any, y: any, tooltip: any, factor: any): any {
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
}

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

  reboundTooltip,
};
