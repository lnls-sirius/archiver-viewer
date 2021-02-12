/* eslint-disable radix */

import archInterface from "../../data-access";
import chartUtils, { hideDatasetByLabel, findAxisIndexById } from "../../utility/chartUtils";
import { RequestsDispatcher, StatusDispatcher } from "../../utility/Dispatchers";
import Browser from "../../utility/Browser";
import store from "../../store";
import {
  setDatasetOptimized,
  setSingleTooltip,
  setTimeReferenceEnd,
  setWindowTime,
  setZooming,
  removeDataset as storeRemoveDataset,
} from "../../features/chart/sliceChart";
import Chart from "chart.js";

import makeChartActionsStack, { StackActionEnum, StackAction, ChartActionsStack } from "./StackAction";
import makeAutoUpdate, { AutoUpdate } from "./AutoUpdate";
import makeChartTime, { ChartTime } from "./Time";

export enum REFERENCE {
  START = 0,
  END = 1,
}
interface ZoomFlags {
  isZooming: boolean;
  hasBegan: boolean;
}
class ChartImpl {
  /* chartjs instance reference */
  private chart: Chart = null;
  // private start: Date;
  // private end: Date;
  private reference = REFERENCE.END; // Reference time end
  private windowTime = chartUtils.timeIDs.MIN10;

  private autoUpdate: AutoUpdate; // Auto update module

  private singleTipEnabled = true;
  private scrollingEnabled = true;
  private serverDateEnabled = true;

  private cachedDate: Date = null;
  private lastFetch: Date = null;

  private datasetLatestFetchRequestTime: { [key: number]: any };
  private stack: ChartActionsStack;
  private time: ChartTime;

  private zoomFlags: ZoomFlags = {
    isZooming: false,
    hasBegan: false,
  };

  constructor() {
    this.time = makeChartTime();
    this.stack = makeChartActionsStack();
    this.autoUpdate = makeAutoUpdate(async () => this.autoUpdateFunction());
    this.datasetLatestFetchRequestTime = {};
  }

  update(settings?: Chart.ChartUpdateProps) {
    this.chart.update(settings);
  }

  /** Get dataset index by it's label */
  private getDatasetIndex(label: string): number {
    // Find dataset index and yAxis
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

  /* start and end timedates */
  setStart(time: Date): void {
    this.time.setStart(time);
  }

  setEnd(time: Date): void {
    this.time.setEnd(time);
  }

  updateTimeWindowOnly(time: number): void {
    this.windowTime = time;
    store.dispatch(setWindowTime(this.windowTime));
  }

  /* Control flags */
  // -----------------------------------------------------------
  isAutoUpdateEnabled(): boolean {
    return this.autoUpdate.isEnabled();
  }
  async autoUpdateFunction(): Promise<void> {
    if (this.reference === REFERENCE.START) {
      this.updateTimeReference(REFERENCE.END);
    }

    const now = await this.getDateNow();

    await this.updateStartAndEnd(now, true);

    chartUtils.updateTimeAxis(
      this.chart,
      chartUtils.timeAxisPreferences[this.windowTime].unit,
      chartUtils.timeAxisPreferences[this.windowTime].unitStepSize,
      this.time.getStart(),
      this.time.getEnd()
    );
    this.updateURL();
    await this.updateAllPlots(false);
  }
  toggleAutoUpdate(): void {
    this.autoUpdate.toggle();
  }
  // -----------------------------------------------------------

  updateTimeReference(r: number): void {
    this.reference = r;
    store.dispatch(setTimeReferenceEnd(this.reference === REFERENCE.END));
  }
  isSingleTipEnabled(): boolean {
    return this.singleTipEnabled;
  }
  setSingleTipEnabled(enabled: boolean) {
    this.singleTipEnabled = enabled;
    store.dispatch(setSingleTooltip(this.singleTipEnabled));
  }

  init(c: Chart): void {
    this.chart = c;
    this.loadTooltipSettings();
  }

  setAxisYAuto(axisName: string) {
    const i = findAxisIndexById(this.chart, axisName);
    if (i === null) {
      return;
    }
    const axis = this.chart.options.scales.yAxes[i];
    delete axis.ticks.max;
    delete axis.ticks.min;
    this.update();
  }

  setAxisYMax(axisName: string, value: any) {
    const i = findAxisIndexById(this.chart, axisName);
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

  setAxisYMin(axisName: string, value: any) {
    const i = findAxisIndexById(this.chart, axisName);
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

  async updateTimeWindow(window: number): Promise<void> {
    this.updateTimeWindowOnly(window);

    if (this.windowTime < chartUtils.timeIDs.MIN_30) {
      if (this.autoUpdate.isEnabled()) {
        this.autoUpdate.setDisabled();
      }
    }

    if (this.reference === REFERENCE.END) {
      this.time.setStart(
        new Date(this.time.getEnd().getTime() - chartUtils.timeAxisPreferences[this.windowTime].milliseconds)
      );
    } else if (this.reference === REFERENCE.START) {
      const now = await this.getDateNow();

      if (
        this.time.getStart().getTime() + chartUtils.timeAxisPreferences[this.windowTime].milliseconds <=
        now.getTime()
      ) {
        this.time.setEnd(
          new Date(this.time.getStart().getTime() + chartUtils.timeAxisPreferences[this.windowTime].milliseconds)
        );
      } else {
        this.time.setEnd(now);
      }
    }

    this.optimizeAllGraphs();
    this.updateAllPlots(true);
    this.updateURL();
    chartUtils.updateTimeAxis(
      this.chart,
      chartUtils.timeAxisPreferences[this.windowTime].unit,
      chartUtils.timeAxisPreferences[this.windowTime].unitStepSize,
      this.time.getStart(),
      this.time.getEnd()
    );
  }

  /**
   * Checks if the request must optimized because of the variable's data volume. It returns -1 if no optimization is required or the number of bins otherwise.
   **/
  shouldOptimizeRequest(_samplingPeriod: number, type: string): number {
    if (type === "DBR_SCALAR_ENUM") {
      return -1;
    }

    if (this.windowTime < chartUtils.timeIDs.HOUR2) {
      return chartUtils.timeAxisPreferences[this.windowTime].bins;
    }

    return -1;
  }

  /** ***** Update functions *******/
  /**
   * The following functions updates the data plotted by the chart. They are called by
   * the event handlers mostly.
   **/

  /**
   * Sets end to date and updates start according
   * to the time window size.
   **/
  async updateEndTime(date: Date, now: Date): Promise<void> {
    // const end = getEnd();
    let newEnd: Date;
    if (!this.time.getEnd()) {
      newEnd = date;
    }
    if (date.getTime() <= now.getTime()) {
      newEnd = date;
    } else {
      newEnd = now;
    }
    const newStartDate = new Date(newEnd.getTime() - chartUtils.timeAxisPreferences[this.windowTime].milliseconds);

    if (newEnd) {
      this.time.setEnd(newEnd);
    }
    this.time.setStart(newStartDate);
  }

  async updateStartTime(date: Date, now: Date) {
    let newStart;
    let newEnd;

    if (!this.time.getStart()) {
      newStart = now;
    }
    const isStartDatePlusWindowTimeSmallerThanNow =
      date.getTime() + chartUtils.timeAxisPreferences[this.windowTime].milliseconds <= now.getTime();

    if (isStartDatePlusWindowTimeSmallerThanNow) {
      const startDatePlusOffset = new Date(
        date.getTime() + chartUtils.timeAxisPreferences[this.windowTime].milliseconds
      );

      newStart = date;
      newEnd = startDatePlusOffset;
    } else {
      const startDateMinusOffset = new Date(
        now.getTime() - chartUtils.timeAxisPreferences[this.windowTime].milliseconds
      );
      newStart = startDateMinusOffset;
      newEnd = now;
    }
    if (newStart) {
      this.time.setStart(newStart);
    }
    if (newEnd) {
      this.time.setEnd(newEnd);
    }
  }
  async updateStartAndEnd(date: Date, undo?: boolean): Promise<void> {
    if (date === undefined || date === null) {
      date = new Date();
    }

    const now = await this.getDateNow();
    const isEndTime = this.reference === REFERENCE.END;

    if (isEndTime) {
      if (undo) {
        this.stack.undoStackPush({ action: StackActionEnum.CHANGE_END_TIME, endTime: this.time.getEnd() });
      }
      await this.updateEndTime(date, now);
    } else {
      if (undo) {
        this.stack.undoStackPush({ action: StackActionEnum.CHANGE_START_TIME, startTime: this.time.getStart() });
      }
      await this.updateStartTime(date, now);
    }
  }

  updateOptimizedWarning(): void {
    let canOptimize = 0;

    for (let i = 0; i < this.chart.data.datasets.length; i++) {
      canOptimize |= (this.chart.data.datasets[i] as any).pv.optimized;
    }

    if (canOptimize) {
      const msg =
        "In order to reduce the data amount retrieved from server, an optimization is used. Each point corresponds to an average calculated over its neighborhood.";
      StatusDispatcher.Warning("Data is being optimized", msg);
    }
  }

  improveData(data: any[]): any[] {
    // WHY!?!
    const unshiftData = [];
    if (data.length > 0) {
      const first = data[0];
      const last = data[data.length - 1];

      if (first.x.getTime() > this.time.getStart().getTime()) {
        unshiftData.push({
          x: this.time.getStart(),
          y: first.y,
        });
      }

      if (last.x.getTime() < this.time.getEnd().getTime()) {
        data.push({
          x: this.time.getEnd(),
          y: last.y,
        });
      }
    }
    data.unshift(...unshiftData);
    return data;
  }

  /**
   * Updates a plot of index pvIndex.
   **/

  async updateEmptyDataset(datasetIndex: number, dataset: Chart.ChartDataSets) {
    const bins = chartUtils.timeAxisPreferences[this.windowTime].bins;

    const thisDatasetRequestTime = new Date().getTime();
    this.datasetLatestFetchRequestTime[datasetIndex] = thisDatasetRequestTime;

    // @todo: Enable loading
    await archInterface
      .fetchData(dataset.label, this.time.getStart(), this.time.getEnd(), (dataset as any).pv.optimized, bins)
      .then((res) => {
        const { data } = res;
        const isTheLatestFetchRequest = this.datasetLatestFetchRequestTime[datasetIndex] === thisDatasetRequestTime;

        if (isTheLatestFetchRequest) {
          if (data.length > 0) {
            Array.prototype.push.apply(dataset.data, this.improveData(data));
          }
          this.datasetLatestFetchRequestTime[datasetIndex] = null;
        }
      })
      .catch((e) => {
        const msg = `Failed to fetch ${dataset.label} data, error ${e}`;
        StatusDispatcher.Error("Archiver data acquisition", msg);
        console.error(msg);
      });
  }

  async updatePlot(datasetIndex: number): Promise<any> {
    // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
    const dataset = this.chart.data.datasets[datasetIndex];

    RequestsDispatcher.IncrementActiveRequests();
    if (dataset.data.length === 0) {
      await this.updateEmptyDataset(datasetIndex, dataset);
      RequestsDispatcher.DecrementActiveRequests();
      return;
    }

    // Gets the time of the first and last element of the dataset
    const first = (dataset.data[0] as any).x;
    const last = (dataset.data[dataset.data.length - 1] as any).x;

    const trimDatasetStart = () => {
      while (dataset.data.length > 0 && (dataset.data[0] as any).x.getTime() < this.time.getStart().getTime()) {
        dataset.data.shift();
      }
    };

    const trimDatasetEnd = () => {
      for (
        let i = dataset.data.length - 1;
        dataset.data.length > 0 && (dataset.data[i] as any).x.getTime() > this.time.getEnd().getTime();
        i--
      ) {
        dataset.data.pop();
      }
    };

    // we need to append data to the beginning of the data set
    const isFistPointAfterTheStart = first.getTime() > this.time.getStart().getTime();
    if (isFistPointAfterTheStart) {
      // Fetches data from the start to the first measure's time
      await this.fillDataFromStartFirst(dataset, first);
    } else {
      trimDatasetStart();
    }

    // we need to append data to the end of the data set
    const isLastPointBeforeTheEnd = last.getTime() < this.time.getEnd().getTime();
    if (isLastPointBeforeTheEnd) {
      await this.fillDataFromLastToEnd(dataset, last);
    } else {
      trimDatasetEnd();
    }

    this.improveData(dataset.data);
    if (dataset.data.length === 0) {
      StatusDispatcher.Info(
        `Empty dataset ${dataset.label}`,
        `No data available for the time interval [${this.time.getStart()}, ${this.time.getEnd()}]`
      );
    }
    RequestsDispatcher.DecrementActiveRequests();
  }

  optimizeAllGraphs(): void {
    this.chart.data.datasets.forEach((dataset, i) => {
      const bins = this.shouldOptimizeRequest((dataset as any).pv.samplingPeriod, (dataset as any).pv.type);
      const optimized = bins < 0 ? false : true;
      (dataset as any).pv.optimized = optimized;

      store.dispatch(setDatasetOptimized({ index: i, optimized: optimized }));
    });
  }

  async fillDataFromLastToEnd(dataset: Chart.ChartDataSets, last: Date) {
    const pvName = dataset.label;
    await archInterface
      .fetchData(pvName, last, this.time.getEnd(), false)
      .then((res) => {
        const { data } = res;

        // Appends new data into the dataset
        if (data.length > 0) {
          let fistPointDate = data[0].x;
          // Verifies if we are not appending redundant data into the dataset
          while (data.length > 0 && fistPointDate.getTime() <= last.getTime()) {
            data.shift();
            if (data.length > 0) {
              fistPointDate = data[0].x;
            }
          }
          dataset.data.push(...(data as any));
        }
      })
      .catch((e) => {
        const msg = `Failed to fill data from ${pvName} [${last} to ${this.time.getEnd()}], error ${e}`;
        console.error(msg);
        StatusDispatcher.Error("Fetch data", msg);
      });
  }

  async fillDataFromStartFirst(dataset: Chart.ChartDataSets, first: Date) {
    const pvName = dataset.label;
    await archInterface
      .fetchData(dataset.label, this.time.getStart(), first, false)
      .then((res) => {
        const { data } = res;
        // Appends new data into the dataset
        if (data.length > 0) {
          let firstPointDate = data[0].x;

          // Verifies if we are not appending redundant data into the dataset
          while (data.length > 0 && firstPointDate.getTime() >= first.getTime()) {
            data.pop(); // remove last element, which is already in the dataset

            if (data.length > 0) {
              firstPointDate = data[0].x;
            }
          }
          dataset.data.unshift(...(data as any));
        }
      })
      .catch((e) => {
        const msg = `Failed to fill data from ${pvName} [${this.time.getStart()} to ${first}], error ${e}`;
        console.error(msg);
        StatusDispatcher.Error("Fill data", msg);
      });
  }

  /**
   * Updates all plots added so far.
   * @param resets: informs if the user wants to reset the data in the dataset.
   **/
  async updateAllPlots(reset: boolean): Promise<any> {
    //  enableLoading();
    if (reset === undefined) {
      reset = false;
    }
    this.updateOptimizedWarning();

    const promisses = this.chart.data.datasets.map(async (dataset, i) => {
      if ((dataset as any).pv.optimized || reset) {
        dataset.data.length = 0;
      }

      await this.updatePlot(i).then(() => {
        this.update();
      });
    });

    await Promise.all(promisses).catch((error) => {
      console.error(`Failed to update all plots ${error.message}`, error);
    });
  }

  /**
   * Checks if a PV is already plotted.
   **/
  getPlotIndex(pvName: string): number {
    // Iterates over the dataset to check if a pv named pvName exists
    for (let i = 0; i < this.chart.data.datasets.length; i++) {
      if (
        this.chart.data.datasets[i].label === pvName ||
        this.chart.data.datasets[i].label === decodeURIComponent(pvName)
      ) {
        return i;
      }
    }

    return null;
  }

  updateURL(): void {
    const { bins } = chartUtils.timeAxisPreferences[this.windowTime];
    const datasets = this.chart.data.datasets;
    Browser.updateAddress(datasets, bins, this.time.getStart(), this.time.getEnd());
  }

  getNewTimeWindow(): number {
    const endTime = this.time.getEnd().getTime();
    const startTime = this.time.getStart().getTime();

    function getCurrentWindowTime(id: number) {
      return chartUtils.timeAxisPreferences[id].milliseconds;
    }
    const minWindowTime = chartUtils.timeIDs.SEG_30;
    function shouldIncreaseWindow(idx: number) {
      return endTime - startTime < getCurrentWindowTime(idx) && idx < minWindowTime;
    }

    let tmpWindowTime = 0;
    while (shouldIncreaseWindow(tmpWindowTime)) {
      tmpWindowTime++;
    }
    return tmpWindowTime;
  }

  loadTooltipSettings() {
    const singleTipCookie = Browser.getCookie("singleTip");

    this.setSingleTipEnabled(singleTipCookie === "true" || singleTipCookie == null);

    chartUtils.toggleTooltipBehavior(this.chart, this.singleTipEnabled);
  }

  shouldGetDateFromRemote() {
    const now = new Date();

    if (!this.lastFetch || !this.cachedDate) {
      this.lastFetch = now;
      return true;
    }

    const timeDeltaSeconds = (now.getTime() - this.lastFetch.getTime()) / 1000;
    if (timeDeltaSeconds > 30) {
      return true;
    }

    return false;
  }

  async getDateNow(): Promise<Date> {
    if (!this.serverDateEnabled) {
      return new Date();
    }

    if (!this.shouldGetDateFromRemote()) {
      return this.cachedDate;
    }

    try {
      const result = await archInterface.getRemoteDate();
      const currentTime = !result ? new Date() : result;

      this.cachedDate = currentTime;
      this.lastFetch = new Date();
      return currentTime;
    } catch (e) {
      console.log("Date retrieval failed. Using local date.");
      this.serverDateEnabled = false;
      return new Date();
    }
  }

  async optimizePlot(datasetLabel: string, optimize: boolean) {
    const datasetIndex = this.getDatasetIndex(datasetLabel);
    (this.chart.data.datasets[datasetIndex] as any).pv.optimized = optimize;
    this.chart.data.datasets[datasetIndex].data.length = 0;

    await this.updatePlot(datasetIndex)
      .then(() => {
        this.updateURL();
        this.update();
        console.log("Plot update at index", datasetIndex);
      })
      .catch((e) => {
        console.log(`Failed to update plot at index ${datasetIndex}, ${e}`);
      });
    store.dispatch(setDatasetOptimized({ index: datasetIndex, optimized: optimize }));
  }

  removeDatasetByName(name: string): void {
    const datasetIndex = this.getDatasetIndex(name);
    this.removeDataset(datasetIndex, false);
  }

  removeDataset(datasetIndex: number, undo?: boolean): void {
    console.log("Remove index", datasetIndex, this.chart.data.datasets);
    chartUtils.yAxisUseCounter()[this.chart.data.datasets[datasetIndex].yAxisID]--;
    chartUtils.colorStack().push(this.chart.data.datasets[datasetIndex].backgroundColor);

    if (!undo || undo === undefined) {
      this.stack.undoStackPush({
        action: StackActionEnum.REMOVE_PV,
        pv: this.chart.data.datasets[datasetIndex].label,
        optimized: (this.chart.data.datasets[datasetIndex] as any).pv.optimized,
      });
    }

    const yAxis = this.chart.data.datasets[datasetIndex].yAxisID;
    const yAxisUseCount = chartUtils.yAxisUseCounter()[yAxis];
    let removeAxis = null;
    if (yAxisUseCount === 0) {
      console.log("Removing Axis");
      delete chartUtils.yAxisUseCounter()[yAxis];
      (this.chart as any).scales[yAxis].options.display = false;
      chartUtils.updateAxisPositionLeft((this.chart as any).scales[yAxis].position === "left");
      delete (this.chart as any).scales[yAxis];

      for (let i = 1; i < this.chart.options.scales.yAxes.length; i++) {
        if (this.chart.options.scales.yAxes[i].id === yAxis) {
          this.chart.options.scales.yAxes.splice(i, 1);
          removeAxis = yAxis;
          break;
        }
      }
    }

    this.chart.data.datasets.splice(datasetIndex, 1);
    this.update({ duration: 0, lazy: false, easing: "linear" });
    this.updateURL();
    this.updateOptimizedWarning();

    store.dispatch(storeRemoveDataset({ idx: datasetIndex, removeAxis: removeAxis }));
  }

  hideAxis(event: { data: { datasetIndex: number } }): void {
    chartUtils.hidesAxis(this.chart.getDatasetMeta(event.data.datasetIndex), this.chart);
    this.update({ duration: 0, lazy: false, easing: "linear" });
  }

  toggleAxisType(axisId: string): void {
    return chartUtils.toggleAxisType(this.chart, axisId);
  }

  hideDataset(label: any): void {
    const datasetIndex = this.getDatasetIndex(label);
    if (datasetIndex === undefined || datasetIndex === null) {
      return;
    }
    return hideDatasetByLabel(datasetIndex, this.chart);
  }

  toggleSingleTip(): void {
    this.setSingleTipEnabled(!this.isSingleTipEnabled());
    Browser.setCookie("singleTip", this.isSingleTipEnabled() ? "true" : "false", 1);
    chartUtils.toggleTooltipBehavior(this.chart, this.isSingleTipEnabled());
  }
  /* Getters */
  getChart(): Chart {
    return this.chart;
  }
  getStart(): Date {
    return this.time.getStart();
  }
  getEnd(): Date {
    return this.time.getEnd();
  }
  getReference(): REFERENCE {
    return this.reference;
  }
  isScrollingEnabled(): boolean {
    return this.scrollingEnabled;
  }
  isServerDateEnabled(): boolean {
    return this.serverDateEnabled;
  }
  getZoomFlags(): ZoomFlags {
    return this.zoomFlags;
  }

  redoStackPop(): StackAction {
    return this.stack.redoStackPop();
  }
  redoStackPush(state: StackAction): void {
    this.stack.redoStackPush(state);
  }

  undoStackPop(): StackAction {
    return this.stack.undoStackPop();
  }
  undoStackPush(state: StackAction): void {
    this.stack.undoStackPush(state);
  }

  getWindowTime(): number {
    return this.windowTime;
  }

  disableServerDate() {
    this.serverDateEnabled = false;
  }

  disableScrolling() {
    this.scrollingEnabled = false;
  }
  enableScrolling() {
    this.scrollingEnabled = true;
  }

  enableZoom() {
    this.zoomFlags.isZooming = true;
    store.dispatch(setZooming(true));
  }

  disableZoom() {
    this.zoomFlags.isZooming = false;
    store.dispatch(setZooming(false));
  }
}

const chartEntity = new ChartImpl();
/*
const originalGetPixelForValue = (Chart.scaleService as any).constructors.linear.prototype.getPixelForValue;
(Chart.scaleService as any).constructors.linear.prototype.getPixelForValue = function (value: any) {
  const pixel = originalGetPixelForValue.call(this, value);
  return Math.min(2147483647, Math.max(-2147483647, pixel));
};
*/
const parentEventHandler = (Chart as any).Controller.prototype.eventHandler;
(Chart as any).Controller.prototype.eventHandler = function () {
  // This is not a duplicate of the cursor positioner, this handler is called when a tooltip's datapoint index does not change.
  // eslint-disable-next-line prefer-rest-params
  const ret = parentEventHandler.apply(this, arguments);

  if (!chartEntity.isSingleTipEnabled()) {
    const ctx: CanvasRenderingContext2D = this.chart.ctx;
    // eslint-disable-next-line prefer-rest-params
    const x = arguments[0].x;
    // const y = arguments[0].y;
    this.clear();
    this.draw();
    const yScale = this.scales["y-axis-0"];
    ctx.beginPath();
    ctx.moveTo(x, yScale.getPixelForValue(yScale.max));
    ctx.strokeStyle = "#ff0000";
    ctx.lineTo(x, yScale.getPixelForValue(yScale.min));
    ctx.stroke();
  }

  this.tooltip.width = this.tooltip._model.width;
  this.tooltip.height = this.tooltip._model.height;

  // eslint-disable-next-line prefer-rest-params
  const coordinates = chartUtils.reboundTooltip(arguments[0].x, arguments[0].y, this.tooltip, 0.5);

  this.tooltip._model.x = coordinates.x;
  this.tooltip._model.y = coordinates.y;

  return ret;
};

export default chartEntity;
