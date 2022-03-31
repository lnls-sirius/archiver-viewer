export interface PlotPVParams {
  name: string;
  optimize: boolean;
  drift: boolean;
  bins?: number;
  updateChart?: boolean;
}

export interface PlotPVs {
  plot(pvs: PlotPVParams[]): void;
  plotPV(pv: PlotPVParams): void;
}
export default PlotPVs;
