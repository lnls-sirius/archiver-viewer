import ChartJSController from "./interface";
export * from "./interface";
import ChartJSControllerImpl from "./impl";

import Chart from "chart.js";

let chartInstance: ChartJSController = null;

export function CreateChartJSController(chart: Chart): ChartJSController {
  chartInstance = new ChartJSControllerImpl(chart);
  return GetChartJSControllerInstance();
}

export function GetChartJSControllerInstance(): ChartJSController {
  return chartInstance;
}
