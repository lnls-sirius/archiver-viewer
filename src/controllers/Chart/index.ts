export interface ChartController {
  setDatasetOptimized(name: string, optimized: boolean): Promise<void>;
  removeDataset(name: string): Promise<void>;
  hideDataset(name: string): void;
  toggleAxisType(name: string): void;

  setAxisYMin(axisId: string, value: number): void;
  setAxisYMax(axisId: string, value: number): void;
  setAxisYManual(axisId: string, manual: boolean): void;
}

import chart from "../../entities/Chart/Chart";
import store from "../../store";
import { setAxisYLimitManual, setAxisYLimitMax, setAxisYLimitMin } from "../../features/chart/sliceChart";

class ChartControllerImpl implements ChartController {
  private async optimizeDataset(label: string, optimize: boolean): Promise<void> {
    await chart.optimizePlot(label, optimize);
  }

  toggleAxisType(name: string): void {
    chart.toggleAxisType(name);
  }

  hideDataset(name: string): void {
    chart.hideDataset(name);
  }

  async removeDataset(name: string): Promise<void> {
    chart.removeDatasetByName(name);
  }

  async setDatasetOptimized(name: string, optimized: boolean): Promise<void> {
    this.optimizeDataset(name, optimized);
  }

  setAxisYMin(axisId: string, value?: number) {
    chart.setAxisYMin(axisId, value);
    store.dispatch(setAxisYLimitMin({ id: axisId, yMin: value }));
  }

  setAxisYMax(axisId: string, value?: number) {
    chart.setAxisYMax(axisId, value);
    store.dispatch(setAxisYLimitMax({ id: axisId, yMax: value }));
  }

  setAxisYManual(axisId: string, manual: boolean) {
    if (!manual) {
      chart.setAxisYAuto(axisId);
    }
    store.dispatch(setAxisYLimitManual({ id: axisId, yLimitManual: manual, yMin: "", yMax: "" }));
  }
}

const chartController: ChartController = new ChartControllerImpl();

export default chartController;
