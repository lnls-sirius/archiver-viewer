/** ***** Chart control functions *******/
import { TIME_AXIS_PREFERENCES, TIME_IDS } from "../lib/timeAxisPreferences";
import { TimeAxisID, TimeUnits } from "./TimeAxis/TimeAxisConstants";
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


function getMilliseconds(value: number, unit: string): number{
  let timeMilliseconds;
  switch (unit) {
    case "year":
      timeMilliseconds = getMilliseconds(value, "day") * 365;
      break;
    case "month":
      timeMilliseconds = getMilliseconds(value, "day") * 30;
      break;
    case "week":
      timeMilliseconds = getMilliseconds(value, "day") * 7;
      break;
    case "day":
      timeMilliseconds = getMilliseconds(value, "hour") * 24;
      break;
    case "hour":
      timeMilliseconds = getMilliseconds(value, "minute") * 60;
      break;
    case "minute":
      timeMilliseconds = getMilliseconds(value, "second") * 60;
      break;
    case "second":
      timeMilliseconds = value * 1000;
      break;
    default:
      throw `Milliseconds conversion not impplemented`;
  }
  return timeMilliseconds;
}

function getUnit(value?: number, unit?: string, windowTime?: number){
  let stepUnit = 'hour';
  if(!windowTime){
    switch (unit) {
      case "year":
        stepUnit = 'month';
        break;
      case "month":
        stepUnit = 'day';
        break;
      case "week":
        stepUnit = 'day';
        break;
      case "day":
        stepUnit = 'hour';
        break;
      case "hour":
        if(value>=4){
          stepUnit = 'hour';
        }else{
          stepUnit = 'minute';
        }
        break;
      case "minute":
        if(value>=10){
          stepUnit = 'minute';
        }else{
          stepUnit = 'second';
        }
        break;
      case "second":
        stepUnit = 'second';
        break;
      default:
        throw `Unit conversion not impplemented`;
    }
  }else{
    stepUnit = TIME_AXIS_PREFERENCES[windowTime].unit;
  }
  return stepUnit;
}

function getUnitStepSize(value?: number, unit?: string, windowTime?: number){
  let unitStepSize = 1;
  if(!windowTime){
    switch (unit) {
      case "year":
        unitStepSize = 2;
        break;
      case "month":
        unitStepSize = 4;
        break;
      case "week":
        unitStepSize = 2;
        break;
      case "day":
        if(value>=2.5){
          unitStepSize = 12;
        }else{
          unitStepSize = 3;
        }
        break;
      case "hour":
        if(value>=4){
          unitStepSize = 2;
        }else{
          unitStepSize = 15;
        }
        break;
      case "minute":
        if(value>=10){
          unitStepSize = 3;
        }else{
          unitStepSize = 15;
        }
        break;
      case "second":
        unitStepSize = 3;
        break;
      default:
        throw `Unit conversion not impplemented`;
    }
  }else{
    unitStepSize = TIME_AXIS_PREFERENCES[windowTime].unitStepSize;
  }
  return unitStepSize;
}

function millisecondsToValUnit(milliseconds: number):Array<string>{
  let unit = " ";
  let val = 1;
  let flag = 0;
  Object.entries(TimeUnits).map(([key, value]) => {
    let tempVal = (milliseconds/getMilliseconds(1, value));
    if(tempVal >= 1 && flag != 1){
      unit = value;
      val = tempVal;
      flag = 1;
    }
  });
  return [val.toString(), unit];
}

export default {
  /* const references */
  timeAxisID: TimeAxisID,
  timeAxisPreferences: TIME_AXIS_PREFERENCES,
  timeIDs: TIME_IDS,

  reboundTooltip,
  getMilliseconds,
  getUnit,
  millisecondsToValUnit,
  getUnitStepSize
};
