export interface ChartTime {
  getEnd(): Date;
  getStart(): Date;
  setEnd(time: Date): void;
  setStart(time: Date): void;
}
export default ChartTime;
