interface PlotPVs {
  plot(pvs: string[], optimize?: boolean): void;
  plotPV(pv: string, optimize?: boolean, updateChart?: boolean): void;
}
export default PlotPVs;
