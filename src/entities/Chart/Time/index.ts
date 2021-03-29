import { ChartTime } from "./interface";
export * from "./interface";

import ChartTimeImpl from "./impl";

function makeChartTime(): ChartTime {
  return new ChartTimeImpl();
}
export default makeChartTime;
