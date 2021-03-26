import Chart from "chart.js";
import { ArchiverMetadata } from "../../../data-access/interface";

export interface DatasetPVInfo {
  precision: number;
  //  type: string;
  // samplingPeriod: number;
  optimized: boolean;
  bins: number;
  desc: string;
  egu: string;
  metadata: ArchiverMetadata;
}

export interface DatasetInfo {
  label: string;
  yAxisID: string; // Axis name
  backgroundColor: string;
  borderColor: string;
  visible: boolean;

  pv: DatasetPVInfo;
}

export interface DataAxis {
  id: string;
  counter: number;
  ticksPrecision: number;
  display: boolean;
  type: "linear" | "logarithmic";
  position: "left" | "right";
  scaleLabel: { display: boolean; labelString: string };
}

export interface ChartJSController {
  updateTimeAxis(unit: any, unitStepSize: any, from: Date, to: Date): void;
  getYAxis(axisId: string): Chart.ChartYAxe;
  getYAxisIndex(axisId: string): number;

  getDatasetIndex(label: string): number;

  toggleAxisType(axisId: string): void;

  appendDataAxis(nId: string, ticksPrecision: number): void;
  appendDataset(data: any[], optimized: boolean, bins: number, metadata: ArchiverMetadata): void;

  setDatasetOptimized(name: string, optimized: boolean): void;
  getDatasetSettings(name: string): DatasetInfo;
  getDatasetSettingsByIndex(datasetIndex: number): DatasetInfo;
  // getDataset(name: string): Chart.ChartDataSets;
  getDatasetByIndex(datasetIndex: number): Chart.ChartDataSets;

  removeDataset(datasetIndex: number): void;
  hideDatasetByIndex(index: number): void;
  hideDataset(label: string): void;

  toggleTooltipBehavior(isSingleTooltipEnabled: boolean): void;

  update(settings?: Chart.ChartUpdateProps): void;

  setAxisYAuto(axisName: string): void;
  setAxisYMax(axisName: string, value: number): void;
  setAxisYMin(axisName: string, value: number): void;
}
export default ChartJSController;
