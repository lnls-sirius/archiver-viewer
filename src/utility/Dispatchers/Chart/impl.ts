import { ChartDispatcher } from "./interface";
import store from "../../../store";
import { actions } from "../../../features/chart";

class ChartDispatcherImpl implements ChartDispatcher {
  setWindowTime(windowTime: number): void {
    store.dispatch(actions.setWindowTime(windowTime));
  }
  setTimeReferenceEnd(timeReferenceEnd: boolean): void {
    store.dispatch(actions.setTimeReferenceEnd(timeReferenceEnd));
  }
  setSingleTooltipEnabled(enabled: boolean): void {
    store.dispatch(actions.setSingleTooltip(enabled));
  }
  setZooming(zooming: boolean): void {
    store.dispatch(actions.setZooming(zooming));
  }
  setDatasetOptimized(index: number, optimized: boolean): void {
    store.dispatch(actions.setDatasetOptimized({ index, optimized }));
  }
  doRemoveDataset(index: number, removeAxis: string): void {
    store.dispatch(actions.removeDataset({ idx: index, removeAxis }));
  }
  setAxisYLimitManual(axisId: string, manual: boolean): void {
    store.dispatch(actions.setAxisYLimitManual({ id: axisId, yLimitManual: manual, yMin: "", yMax: "" }));
  }
  setAxisYLimitMin(axisId: string, value?: number): void {
    store.dispatch(actions.setAxisYLimitMin({ id: axisId, yMin: value }));
  }
  setAxisYLimitMax(axisId: string, value?: number): void {
    store.dispatch(actions.setAxisYLimitMax({ id: axisId, yMax: value }));
  }
}

export default ChartDispatcherImpl;
