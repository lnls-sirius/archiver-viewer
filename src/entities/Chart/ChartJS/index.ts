import ChartJSController from "./interface";
export * from "./interface";
import ChartJSControllerImpl from "./impl";

import Chart from "chart.js";

export default function makeChartJSController(chart: Chart): ChartJSController {
  return new ChartJSControllerImpl(chart);
}
