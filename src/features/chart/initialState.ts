import { DatasetInfo } from "../../entities/Chart/ChartJS";
import { TIME_IDS } from "../../lib/timeAxisPreferences";
export interface ChartState {
  dataAxis: any[]; // @todo: Transform into an object
  datasets: DatasetInfo[]; // @todo: Transform into an object
  singleTooltip: boolean;
  timeEnd: string;
  timeReferenceEnd: boolean;
  timeStart: string;
  windowTime: number;
  zooming: boolean;
  selectedTime: string;
}

const initialState: ChartState = {
  dataAxis: [], // @todo: Transform into an object
  datasets: [], // @todo: Transform into an object
  singleTooltip: true,
  timeEnd: null,
  timeReferenceEnd: true,
  timeStart: null,
  windowTime: TIME_IDS.MIN_30,
  zooming: false,
  selectedTime: null
};
export default initialState;
