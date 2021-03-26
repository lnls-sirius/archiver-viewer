import { ChartDispatcher } from "../../../utility/Dispatchers";
import ChartTime from "./interface";

class ChartTimeImpl implements ChartTime {
  private end: Date;
  private start: Date;

  getEnd(): Date {
    return this.end;
  }

  getStart(): Date {
    return this.start;
  }

  setEnd(time: Date): void {
    this.end = time;
    ChartDispatcher.setTimeEnd(time);
  }

  setStart(time: Date): void {
    this.start = time;
    ChartDispatcher.setTimeStart(time);
  }
}
export default ChartTimeImpl;
