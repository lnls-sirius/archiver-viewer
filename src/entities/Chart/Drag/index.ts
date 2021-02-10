export * from "./interface";
import { ChartDrag } from "./interface";
import ChartDragImpl from "./impl";

function makeChartDrag(): ChartDrag {
  return new ChartDragImpl();
}
export default makeChartDrag;
