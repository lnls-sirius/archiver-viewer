import { ChartDispatcher } from "./interface";
import store from "../../../store";
import { actions } from "../../../features/chart";

class ChartDispatcherImpl implements ChartDispatcher {
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
