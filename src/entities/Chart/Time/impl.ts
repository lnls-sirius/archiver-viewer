import { ChartDispatcher } from "../../../utility/Dispatchers";
import ChartTime from "./interface";

class ChartTimeImpl implements ChartTime {
  private end: Date;
  private start: Date;
  private reference: Date;

  getEnd(): Date {
    return this.end;
  }

  getStart(): Date {
    return this.start;
  }

  getRefDiff(): Date {
    return this.reference;
  }

  setEnd(time: Date): void {
    this.end = time;
    ChartDispatcher.setTimeEnd(time);
  }

  setStart(time: Date): void {
    this.start = time;
    ChartDispatcher.setTimeStart(time);
  }

  setRefDiff(time: Date): void {
    this.reference = time;
    ChartDispatcher.setSelectedTime(time);
  }
}
export default ChartTimeImpl;
