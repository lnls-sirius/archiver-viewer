interface PlotPVs {
  plot(pvs: string[]): void;
  plotPV(pv: string, update?: boolean): void;
}
export default PlotPVs;
