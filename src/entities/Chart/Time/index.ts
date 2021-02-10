import store from "../../../store";
import { setTimeEnd, setTimeStart } from "../../../features/chart/sliceChart";
export interface ChartTime {
  getEnd(): Date;
  getStart(): Date;
  setEnd(time: Date): void;
  setStart(time: Date): void;
  setStartEnd(start: Date, end: Date): void;
}
class ChartTimeImpl implements ChartTime {
  private end: Date;
  private start: Date;
  constructor() {
    //
  }

  getEnd(): Date {
    return this.end;
  }
  getStart(): Date {
    return this.start;
  }
  setEnd(time: Date): void {
    store.dispatch(setTimeEnd(time));
    this.end = time;
  }
  setStart(time: Date): void {
    store.dispatch(setTimeStart(time));
    this.start = time;
  }
  setStartEnd(start: Date, end: Date): void {
    throw new Error("Method not implemented.");
  }
}

function makeChartTime(): ChartTime {
  return new ChartTimeImpl();
}
export default makeChartTime;
