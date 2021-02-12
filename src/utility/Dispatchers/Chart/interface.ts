export interface ChartDispatcher {
  setAxisYLimitManual(axisId: string, manual: boolean): void;
  setAxisYLimitMin(axisId: string, value?: number): void;
  setAxisYLimitMax(axisId: string, value?: number): void;
}
