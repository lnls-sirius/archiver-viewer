import { DatasetInfo } from "../../entities/Chart/ChartJS";
import { TIME_AXIS_PREFERENCES, TIME_IDS } from "../../lib/timeAxisPreferences";
export interface ChartState {
  autoScroll: boolean;
  dataAxis: any[]; // @todo: Transform into an object
  datasets: DatasetInfo[]; // @todo: Transform into an object
  singleTooltip: boolean;
  timeEnd: string;
  timeReferenceEnd: boolean;
  timeStart: string;
  windowTime: number;
  interval: number;
  zooming: boolean;
  selectedTime: string;
}

const initialState: ChartState = {
  autoScroll: false,
  dataAxis: [], // @todo: Transform into an object
  datasets: [], // @todo: Transform into an object
  singleTooltip: false,
  timeEnd: null,
  timeReferenceEnd: true,
  timeStart: null,
  windowTime: TIME_IDS.MIN_30,
  interval: TIME_AXIS_PREFERENCES[TIME_IDS.MIN_30].milliseconds,
  zooming: false,
  selectedTime: null
};
export default initialState;
