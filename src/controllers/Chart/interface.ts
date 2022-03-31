export interface ChartController {
  setDatasetOptimized(name: string, optimized: boolean): Promise<void>;
  setDatasetDiff(name: string, diff: boolean): Promise<void>;
  removeDataset(name: string): Promise<void>;
  hideDataset(name: string): void;
  toggleAxisType(name: string): void;

  setAxisYMin(axisId: string, value: number): void;
  setAxisYMax(axisId: string, value: number): void;
  setAxisYManual(axisId: string, manual: boolean): void;
}
