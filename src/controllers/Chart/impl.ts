import chart from "../../entities/Chart";
import { ChartDispatcher } from "../../utility/Dispatchers";
import { ChartController } from "./interface";

export class ChartControllerImpl implements ChartController {
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

  setAxisYMin(axisId: string, value?: number): void {
    chart.setAxisYMin(axisId, value);
    ChartDispatcher.setAxisYLimitMin(axisId, value);
  }

  setAxisYMax(axisId: string, value?: number): void {
    chart.setAxisYMax(axisId, value);
    ChartDispatcher.setAxisYLimitMax(axisId, value);
  }

  setAxisYManual(axisId: string, manual: boolean): void {
    if (!manual) {
      chart.setAxisYAuto(axisId);
    }
    ChartDispatcher.setAxisYLimitManual(axisId, manual);
  }
}
