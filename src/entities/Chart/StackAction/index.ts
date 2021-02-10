export * from "./interface";
export * from "./constants";
import { ChartActionsStack } from "./interface";
import ChartActionsStackImpl from "./impl";

function makeChartActionsStack(): ChartActionsStack {
  return new ChartActionsStackImpl();
}

export default makeChartActionsStack;
