import chart from "../../entities/Chart";
import { ChartDispatcher } from "../../utility/Dispatchers";
import { ChartController } from "./interface";

export class ChartControllerImpl implements ChartController {
  private async optimizeDataset(label: string, optimize: boolean): Promise<void> {
    await chart.optimizePlot(label, optimize);
  }

  private async driftDataset(label: string, drift: boolean): Promise<void> {
    await chart.driftPlot(label, drift);
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

  async setDatasetDrift(name: string, drift: boolean): Promise<void> {
    this.driftDataset(name, drift);
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
