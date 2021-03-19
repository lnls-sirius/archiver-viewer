export interface ChartDispatcher {
  setAxisYLimitManual(axisId: string, manual: boolean): void;
  setAxisYLimitMin(axisId: string, value?: number): void;
  setAxisYLimitMax(axisId: string, value?: number): void;

  /** Window Time ID */
  setWindowTime(windowTime: number): void;
  setTimeReferenceEnd(timeReferenceEnd: boolean): void;
  setSingleTooltipEnabled(enabled: boolean): void;
  setZooming(zooming: boolean): void;

  setDatasetOptimized(index: number, optimized: boolean): void;
  doRemoveDataset(index: number, removeAxis: string): void;
}
