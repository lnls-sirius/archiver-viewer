export * from "./interface";
import ChartDispatcherImpl from "./impl";
import { ChartDispatcher } from "./interface";

function makeChartDispatcher(): ChartDispatcher {
  return new ChartDispatcherImpl();
}
const chartDispatcher: ChartDispatcher = makeChartDispatcher();
export default chartDispatcher;
