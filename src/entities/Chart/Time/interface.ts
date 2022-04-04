export interface ChartTime {
  getEnd(): Date;
  getStart(): Date;
  getRefDiff(): Date;
  setEnd(time: Date): void;
  setStart(time: Date): void;
  setRefDiff(time: Date): void;
}
export default ChartTime;
