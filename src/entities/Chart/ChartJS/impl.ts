import Chart from "chart.js";
import ChartJSController, { DatasetInfo, DatasetPVInfo, DataAxis } from "./interface";

import { TimeAxisID, TimeAxisIndex } from "../../../utility/TimeAxis/TimeAxisConstants";
import { eguNormalize } from "../../../utility/egu";
import { colorStack, randomColorGenerator } from "../../../utility/color";
import { ChartDispatcher } from "../../../utility/Dispatchers";
import { ArchiverMetadata } from "../../../data-access/interface";

class ChartJSControllerImpl implements ChartJSController {
  private chart: Chart;

  private dataAxes: { [key: string]: DataAxis } = {};
  private datasets: { [key: string]: DatasetInfo } = {};
  private lastPosition: "left" | "right" = "left";

  constructor(chart: Chart) {
    this.chart = chart;
    const labelCallback = (tooltipItem: Chart.ChartTooltipItem, data: Chart.ChartData): string | string[] => {
      return this.labelCallback(tooltipItem, data);
    };
    this.chart.options.tooltips.callbacks.label = labelCallback;
  }

  /**
   * Edits tooltip's label before printing them in the screen.
   **/
  private labelCallback(tooltipItem: Chart.ChartTooltipItem, data: Chart.ChartData) {
    const { datasetIndex, yLabel } = tooltipItem;
    const {
      label,
      pv: {
        precision,
        metadata: { DBRType },
      },
    } = this.getDatasetSettingsByIndex(datasetIndex);

    const value = yLabel as number;

    switch (DBRType) {
      case "DBR_SCALAR_BYTE":
      case "DBR_SCALAR_ENUM":
      case "DBR_SCALAR_INT":
      case "DBR_SCALAR_SHORT":
      case "DBR_WAVEFORM_STRING": {
        return `${label}: ${value.toFixed(0)}`;
      }
    }

    let displayValue = "";

    if (precision > 4) {
      displayValue = value.toExponential(3);
    } else if (precision > 0 && precision < 4) {
      displayValue = value.toFixed(precision);
    } else if (value !== 0 && Math.abs(value) < Math.pow(10, -precision)) {
      displayValue = value.toExponential(Math.min(3, precision));
    } else {
      displayValue = value.toExponential(precision);
    }

    return `${label}: ${displayValue}`;
  }

  getDataset(name: string): Chart.ChartDataSets {
    throw new Error("Method not implemented.");
  }

  getDatasetByIndex(datasetIndex: number): Chart.ChartDataSets {
    return this.chart.data.datasets[datasetIndex];
  }

  private getDatasetIndexFromName(name: string): number {
    for (let i = 0; i < this.chart.data.datasets.length; i++) {
      const dSet = this.chart.data.datasets[i];
      if (dSet && dSet.label === name) {
        return i;
      }
    }
  }

  private getDatasetNameFromIndex(datasetIndex: number): string {
    return this.chart.data.datasets[datasetIndex].label;
  }

  setDatasetOptimized(label: string, optimized: boolean): void {
    if (!(label in this.datasets)) {
      console.error(`Failed to optimize dataset ${label}, entry does not exists in ${this.datasets}`);
      return;
    }

    this.datasets[label].pv.optimized = optimized;
    this.chart.data.datasets.forEach((dataset) => {
      if (dataset.label === label) {
        dataset.data = [];
      }
    });

    const datasetIndex = this.getDatasetIndex(label);
    ChartDispatcher.setDatasetOptimized(datasetIndex, optimized);
  }

  getDatasetSettings(name: string): DatasetInfo {
    return this.datasets[name];
  }

  getDatasetSettingsByIndex(datasetIndex: number): DatasetInfo {
    const name = this.getDatasetNameFromIndex(datasetIndex);
    if (name in this.datasets) {
      return Object.freeze(this.datasets[name]);
    }
    return null;
  }

  setAxisYAuto(axisName: string): void {
    const i = this.findAxisIndexById(axisName);
    if (i === null) {
      return;
    }
    const axis = this.chart.options.scales.yAxes[i];
    delete axis.ticks.max;
    delete axis.ticks.min;
    this.update();
  }

  setAxisYMax(axisName: string, value: number): void {
    const i = this.findAxisIndexById(axisName);
    if (i === null) {
      return;
    }
    const axis = this.chart.options.scales.yAxes[i];

    if (value === undefined) {
      delete axis.ticks.max;
    } else {
      if (!("max" in axis.ticks) || ("max" in axis.ticks && value !== axis.ticks.max)) {
        axis.ticks.max = value;
      }
    }
    this.update();
  }

  setAxisYMin(axisName: string, value: number): void {
    const i = this.findAxisIndexById(axisName);
    if (i === null) {
      return;
    }
    const axis = this.chart.options.scales.yAxes[i];

    if (value === undefined) {
      delete axis.ticks.min;
    } else {
      if (!("min" in axis.ticks) || ("min" in axis.ticks && value !== axis.ticks.min)) {
        axis.ticks.min = value;
      }
    }
    this.update();
  }

  update(settings?: Chart.ChartUpdateProps): void {
    if (settings === undefined) {
      settings = { duration: 0, easing: "linear", lazy: false };
    }
    this.chart.update(settings);
  }

  private lastPositionFlip(): void {
    this.lastPosition = this.lastPosition === "left" ? "right" : "left";
  }

  private findAxisIndexById(axisId: string): number {
    for (let i = 1; i < this.chart.options.scales.yAxes.length; i++) {
      if (this.chart.options.scales.yAxes[i].id === axisId) {
        return i;
      }
    }
    console.error(`Failed to find index of axis ${axisId}`);
    return null;
  }

  getDatasetIndex(label: string): number {
    let datasetIndex: any = null;
    this.chart.data.datasets.forEach((e: any, i: number) => {
      if (datasetIndex !== null) {
        return;
      }
      if (e.label === label) {
        datasetIndex = i;
      }
    });
    if (datasetIndex === null) {
      // Failed to obtain dataset info
      console.error(`Failed to get dataset index of label ${label}`);
    }
    return datasetIndex;
  }

  updateTimeAxis(unit: Chart.TimeUnit, unitStepSize: number, from: Date, to: Date): void {
    this.chart.options.scales.xAxes[TimeAxisIndex].time.unit = unit;
    this.chart.options.scales.xAxes[TimeAxisIndex].time.stepSize = unitStepSize;
    this.chart.options.scales.xAxes[TimeAxisIndex].ticks.min = from.toString();
    this.chart.options.scales.xAxes[TimeAxisIndex].ticks.max = to.toString();
  }

  getYAxis(axisId: string): Chart.ChartYAxe {
    if (this.chart.options.scales.yAxes.length <= 1) {
      return null;
    }
    for (let i = 1; i < this.chart.options.scales.yAxes.length; i++) {
      if (this.chart.options.scales.yAxes[i].id === axisId) {
        return this.chart.options.scales.yAxes[i];
      }
    }
    return null;
  }

  getYAxisIndex(axisId: string): number {
    throw new Error("Method not implemented.");
  }

  toggleAxisType(axisId: string): void {
    const axis: DataAxis = this.dataAxes[axisId];

    if (axis === undefined) {
      console.error(`Axis ${axisId} does not exists`);
      return;
    }

    axis.type = axis.type === "linear" ? "logarithmic" : "linear";

    const yAxis = this.getYAxis(axisId);
    if (yAxis === null) {
      return;
    }
    yAxis.type = axis.type;

    this.chart.update();

    // @todo: Move the store access to another place
    ChartDispatcher.setAxisYType(axisId, axis.type);
  }

  appendDataAxis(nId: string, ticksPrecision: number): void {
    if (nId in this.dataAxes) {
      /* Increments the number of times this axis is used by a PV. */
      const axis = this.dataAxes[nId];
      axis.counter++;
      return;
    }

    const dataAxisSettings: DataAxis = {
      id: nId,
      counter: 1,
      ticksPrecision: ticksPrecision !== undefined ? ticksPrecision : 3,
      type: "linear",
      display: true,
      position: this.lastPosition,
      scaleLabel: {
        display: true,
        labelString: nId,
      },
    };
    this.dataAxes[nId] = dataAxisSettings;
    this.lastPositionFlip();

    // Function which is called when the scale is being drawn.
    const ticksCallback = (value: number) => {
      let ticksPrecision = 3;
      if (nId in this.dataAxes) {
        ticksPrecision = this.dataAxes[nId].ticksPrecision;
      }

      if (value !== 0 && Math.abs(value) < Math.pow(10, -ticksPrecision)) {
        return value.toExponential(ticksPrecision);
      }

      /* ticksPrecision stands for the number of decimal cases shown by the plot in the vertical axis */
      if (ticksPrecision > 4) {
        return value.toExponential(3);
      }

      return value.toFixed(ticksPrecision);
    };

    const { id, type, display, position } = dataAxisSettings;
    this.chart.options.scales.yAxes.push({
      id,
      type,
      display,
      position,
      scaleLabel: {
        display: dataAxisSettings.scaleLabel.display,
        labelString: dataAxisSettings.scaleLabel.labelString,
      },
      ticks: {
        callback: ticksCallback,
        minor: {
          display: true,
          labelOffset: 0,
          padding: 0,
        },
      },
    });
    this.chart.update();

    ChartDispatcher.addAxisY(dataAxisSettings);
  }

  appendDataset(data: any[], optimized: boolean, bins: number, metadata: ArchiverMetadata): void {
    const { pvName, samplingPeriod, DBRType, EGU, PREC } = metadata;
    const unit = eguNormalize(EGU, pvName);

    // Parses the data fetched from the archiver the way that the chart's internal classes can plot
    const color = colorStack.length > 0 ? colorStack.pop() : randomColorGenerator();

    // Adds a new vertical axis if no other with the same unit exists
    this.appendDataAxis(unit, PREC);

    // Pushes it into the chart
    // @todo: Update the store at control.js
    const pv: DatasetPVInfo = {
      precision: PREC,
      optimized: optimized,
      bins: bins > 0 ? bins : 800, // Default for wierd bin size
      desc: "",
      egu: unit,
      metadata: metadata,
    };
    const newDatasetInfo: DatasetInfo = {
      label: pvName,
      yAxisID: unit,
      backgroundColor: color,
      borderColor: color,
      visible: true,
      pv,
    };

    this.datasets[pvName] = newDatasetInfo;

    this.chart.data.datasets.forEach((ds) => {
      if (ds.label === newDatasetInfo.label) {
        throw `Unexpected error, dataset already exists ${ds}`;
      }
    });

    const { label, yAxisID, backgroundColor, borderColor } = newDatasetInfo;
    this.chart.data.datasets.push({
      label,
      yAxisID,
      backgroundColor,
      borderColor,
      xAxisID: TimeAxisID,
      borderWidth: 1.5,
      data: data,
      fill: false,
      pointRadius: 0,
      showLine: true,
      steppedLine: true,
    });
    this.chart.update();

    ChartDispatcher.addDataset(newDatasetInfo);
  }

  private removeDataAxis(yAxisID: string): null | string {
    if (!(yAxisID in this.dataAxes)) {
      throw new Error(`Impossible to remove yAxis ${yAxisID}, axis does not exists`);
    }

    const axis = this.dataAxes[yAxisID];

    axis.counter--;

    if (axis.counter > 0) {
      return null;
    }

    for (let i = 1; i < this.chart.options.scales.yAxes.length; i++) {
      if (this.chart.options.scales.yAxes[i].id === yAxisID) {
        delete this.dataAxes[yAxisID];
        this.chart.options.scales.yAxes.splice(i, 1);
        console.log(`Removing Axis ${yAxisID}`);
        return yAxisID;
      }
    }
    console.warn(`Axis ${yAxisID} could not be found`);
    return null;
  }

  removeDataset(datasetIndex: number): void {
    console.log(`Removing dataset ${datasetIndex}`, this.chart.data.datasets);
    const { label, yAxisID } = this.chart.data.datasets[datasetIndex];

    if (label === undefined) {
      throw new Error(`Invalid dataset index ${datasetIndex}`);
    }

    const dataset = this.datasets[label];

    const removeAxis = this.removeDataAxis(yAxisID);
    colorStack.push(dataset.backgroundColor);

    delete this.datasets[label];
    this.chart.data.datasets.splice(datasetIndex, 1);
    this.chart.update({ duration: 0, lazy: false, easing: "linear" });

    ChartDispatcher.doRemoveDataset(datasetIndex, removeAxis);
  }

  hideDatasetByIndex(index: number): void {
    // Update visibility status
    const meta = this.chart.getDatasetMeta(index);
    const { yAxisID } = meta;

    const axis = this.dataAxes[yAxisID];

    if (meta.hidden) {
      meta.hidden = false;
      axis.counter++;
    } else {
      meta.hidden = true;
      axis.counter--;
    }

    this.chart.update({ duration: 0 });

    ChartDispatcher.setDatasetVisible(index, !meta.hidden);
  }

  hideDataset(label: string): void {
    const datasetIndex = this.getDatasetIndex(label);
    if (datasetIndex === undefined || datasetIndex === null) {
      return;
    }
    this.hideDatasetByIndex(datasetIndex);
  }

  toggleTooltipBehavior(isSingleTooltipEnabled: boolean): void {
    if (isSingleTooltipEnabled) {
      this.chart.options.tooltips.position = "nearest";
      this.chart.options.tooltips.mode = "nearest";
      this.chart.options.tooltips.caretSize = 5;
      this.chart.options.elements.point.hoverRadius = 5;
    } else {
      this.chart.options.tooltips.position = "cursor";
      this.chart.options.tooltips.mode = "nearest";
      this.chart.options.tooltips.caretSize = 0;
      this.chart.options.elements.point.hoverRadius = 0;
    }

    this.chart.update();
  }
}
export default ChartJSControllerImpl;
