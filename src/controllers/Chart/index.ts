export interface ChartController {
  setDatasetOptimized(name: string, optimized: boolean): Promise<void>;
  removeDataset(name: string): Promise<void>;
  hideDataset(name: string): void;
  toggleAxisType(name: string): void;
}

import chart from "../../entities/Chart/Chart";

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
}

const chartController: ChartController = new ChartControllerImpl();

export default chartController;
