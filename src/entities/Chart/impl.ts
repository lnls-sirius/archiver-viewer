/* eslint-disable radix */

import archInterface from "../../data-access";
import chartUtils from "../../utility/chartUtils";
import { RequestsDispatcher, StatusDispatcher, ChartDispatcher } from "../../utility/Dispatchers";
import Browser from "../../utility/Browser";
import { fixOutOfRangeData } from "../../utility/data";
import Chart from "chart.js";

import makeChartActionsStack, { StackActionEnum, StackAction, ChartActionsStack } from "./StackAction";
import makeAutoUpdate, { AutoUpdate } from "./AutoUpdate";
import makeChartTime, { ChartTime } from "./Time";
import makeChartJSController, { ChartJSController } from "./ChartJS";
import { ArchiverMetadata } from "../../data-access/interface";
import { OptimizeDataError } from "../../utility/errors";
import { Settings, SettingsPVs } from "../../utility/Browser/interface";

export enum REFERENCE {
  START = 0,
  END = 1,
}

interface ZoomFlags {
  isZooming: boolean;
  hasBegan: boolean;
}

interface ChartController {
  appendDataset(data: any[], optimized: boolean, bins: number, metadata: ArchiverMetadata): void;
  updateTimeAxis(start?: Date, end?: Date): void;
}

class ChartImpl implements ChartController {
  /* chartjs instance reference */
  private chart: Chart = null;
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
  private chartjs: ChartJSController;

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

  updateTimeAxis(start?: Date, end?: Date): void {
    if (start === undefined) {
      start = this.time.getStart();
    }
    if (end === undefined) {
      end = this.time.getEnd();
    }
    // @todo: This should be a private method... more refactoring needed
    const { unit, unitStepSize } = chartUtils.timeAxisPreferences[this.windowTime];
    this.chartjs.updateTimeAxis(unit, unitStepSize, start, end);
  }

  appendDataset(data: any[], optimized: boolean, bins: number, metadata: ArchiverMetadata): void {
    this.chartjs.appendDataset(data, optimized, bins, metadata);
  }

  init(c: Chart): void {
    this.chart = c;
    this.chartjs = makeChartJSController(c);
    this.loadTooltipSettings();
  }

  update(settings?: Chart.ChartUpdateProps) {
    this.chartjs.update(settings);
  }

  /** Get dataset index by it's label */
  private getDatasetIndex(label: string): number {
    return this.chartjs.getDatasetIndex(label);
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
    ChartDispatcher.setWindowTime(this.windowTime);
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

    const { unit, unitStepSize } = chartUtils.timeAxisPreferences[this.windowTime];
    this.chartjs.updateTimeAxis(unit, unitStepSize, this.time.getStart(), this.time.getEnd());
    this.updateURL();
    await this.updateAllPlots();
  }

  toggleAutoUpdate(): void {
    this.autoUpdate.toggle();
  }
  // -----------------------------------------------------------

  updateTimeReference(r: number): void {
    this.reference = r;
    ChartDispatcher.setTimeReferenceEnd(this.reference === REFERENCE.END);
  }

  isSingleTipEnabled(): boolean {
    return this.singleTipEnabled;
  }

  setSingleTipEnabled(enabled: boolean) {
    this.singleTipEnabled = enabled;
    ChartDispatcher.setSingleTooltipEnabled(enabled);
  }

  setAxisYAuto(axisName: string) {
    this.chartjs.setAxisYAuto(axisName);
  }

  setAxisYMax(axisName: string, value: number) {
    this.chartjs.setAxisYMax(axisName, value);
  }

  setAxisYMin(axisName: string, value: number) {
    this.chartjs.setAxisYMin(axisName, value);
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
    const { unit, unitStepSize } = chartUtils.timeAxisPreferences[this.windowTime];
    this.chartjs.updateTimeAxis(unit, unitStepSize, this.time.getStart(), this.time.getEnd());

    await this.updateAllPlots(true).then(() => {
      this.updateURL();
    });
  }

  /**
   * Checks if the request must optimized because of the variable's data volume. It returns -1 if no optimization is required or the number of bins otherwise.
   **/
  shouldOptimizeRequest({ DBRType, computedEventRate }: ArchiverMetadata): number {
    if (DBRType === "DBR_SCALAR_ENUM") {
      return -1;
    }
    const timeIntervalSeconds = (this.getEnd().getTime() - this.getStart().getTime()) / 1000;
    const estimateSamples = timeIntervalSeconds * computedEventRate;

    // const windowWidthPixels = window.innerWidth;
    // const maxPoints = windowWidthPixels;
    const maxPoints = 1200; // Hardcoded...

    if (estimateSamples > maxPoints) {
      return maxPoints;
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
    let canOptimize = false;

    for (let i = 0; i < this.chart.data.datasets.length; i++) {
      const label = this.chart.data.datasets[i].label;
      canOptimize = this.chartjs.getDatasetSettings(label).pv.optimized || canOptimize;
    }

    if (canOptimize) {
      const msg =
        "In order to reduce the data amount retrieved from server, an optimization is used. Each point corresponds to an average calculated over its neighborhood.";
      StatusDispatcher.Warning("Data is being optimized", msg);
    }
  }

  /**
   * Updates a plot of index pvIndex.
   **/
  async updateEmptyDataset(datasetIndex: number) {
    RequestsDispatcher.IncrementActiveRequests();
    const {
      label,
      pv: { bins, optimized },
    } = this.chartjs.getDatasetSettingsByIndex(datasetIndex);

    const thisDatasetRequestTime = new Date().getTime();
    this.datasetLatestFetchRequestTime[datasetIndex] = thisDatasetRequestTime;

    try {
      const { data } = await archInterface.fetchData(label, this.time.getStart(), this.time.getEnd(), optimized, bins);
      const isTheLatestFetchRequest = this.datasetLatestFetchRequestTime[datasetIndex] === thisDatasetRequestTime;

      if (isTheLatestFetchRequest) {
        if (data.length > 0) {
          const _data = fixOutOfRangeData(data, this.getStart(), this.getEnd());
          const dataset = this.chartjs.getDatasetByIndex(datasetIndex);
          dataset.data = _data;
          this.chartjs.update();
        }
        this.datasetLatestFetchRequestTime[datasetIndex] = null;
      }
    } catch (e) {
      if (e instanceof OptimizeDataError) {
        this.chartjs.setDatasetOptimized(label, false);
        this.updateEmptyDataset(datasetIndex);
      } else {
        const msg = `Failed to fetch ${label} data, error ${e}`;
        StatusDispatcher.Error("Archiver data acquisition", msg);
        console.error(msg);
      }
    } finally {
      RequestsDispatcher.DecrementActiveRequests();
    }
  }

  async updatePlot(datasetIndex: number): Promise<any> {
    // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
    const dataset = this.chart.data.datasets[datasetIndex];

    if (dataset.data.length === 0) {
      await this.updateEmptyDataset(datasetIndex);
      return;
    }

    // Gets the time of the first and last element of the dataset
    const first = (dataset.data[0] as any).x;
    const last = (dataset.data[dataset.data.length - 1] as any).x;

    const trimDatasetStart = () => {
      while (dataset.data.length > 1 && (dataset.data[0] as any).x.getTime() < this.time.getStart().getTime()) {
        dataset.data.shift();
      }
    };

    const trimDatasetEnd = () => {
      for (
        let i = dataset.data.length - 1;
        dataset.data.length > 1 && (dataset.data[i] as any).x.getTime() > this.time.getEnd().getTime();
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

    const _data = fixOutOfRangeData(dataset.data, this.getStart(), this.getEnd());
    dataset.data = _data;

    if (dataset.data.length === 0) {
      StatusDispatcher.Info(
        `Empty dataset ${dataset.label}`,
        `No data available for the time interval [${this.time.getStart()}, ${this.time.getEnd()}]`
      );
    }
  }

  /** Mark graphs to be optimized */
  optimizeAllGraphs(): void {
    this.chart.data.datasets.forEach((dataset) => {
      const {
        label,
        pv: { metadata },
      } = this.chartjs.getDatasetSettings(dataset.label);

      if (this.shouldOptimizeRequest(metadata)) {
        this.chartjs.setDatasetOptimized(label, true);
      }
    });
  }

  async fillDataFromLastToEnd(dataset: Chart.ChartDataSets, last: Date) {
    RequestsDispatcher.IncrementActiveRequests();

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
          this.update();
        }
      })
      .catch((e) => {
        const msg = `Failed to fill data from ${pvName} [${last} to ${this.time.getEnd()}], error ${e}`;
        console.error(msg);
        StatusDispatcher.Error("Fetch data", msg);
      })
      .finally(() => {
        RequestsDispatcher.DecrementActiveRequests();
      });
  }

  async fillDataFromStartFirst(dataset: Chart.ChartDataSets, first: Date) {
    const pvName = dataset.label;
    RequestsDispatcher.IncrementActiveRequests();
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
          this.update();
        }
      })
      .catch((e) => {
        const msg = `Failed to fill data from ${pvName} [${this.time.getStart()} to ${first}], error ${e}`;
        console.error(msg);
        StatusDispatcher.Error("Fill data", msg);
      })
      .finally(() => {
        RequestsDispatcher.DecrementActiveRequests();
      });
  }

  /**
   * Updates all plots added so far.
   * @param resets: informs if the user wants to reset the data in the dataset.
   **/
  async updateAllPlots(reset = false): Promise<any> {
    this.updateOptimizedWarning();

    const promisses = this.chart.data.datasets.map(async (dataset, i) => {
      const label = dataset.label;
      if (this.chartjs.getDatasetSettings(label).pv.optimized || reset) {
        dataset.data = [];
        this.update();
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
    const pvs: SettingsPVs[] = [];
    this.chart.data.datasets.forEach((e) => {
      const {
        label,
        pv: { bins, optimized },
      } = this.chartjs.getDatasetSettings(e.label);
      pvs.push({ bins, label, optimized });
    });

    const settings: Settings = { end: this.time.getEnd(), start: this.time.getStart(), pvs };
    Browser.updateAddress(settings);
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
    this.chartjs.toggleTooltipBehavior(this.singleTipEnabled);
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
    this.chartjs.setDatasetOptimized(datasetLabel, optimize);

    const datasetIndex = this.chartjs.getDatasetIndex(datasetLabel);

    await this.updatePlot(datasetIndex)
      .then(() => {
        this.updateURL();
        this.update();
        console.log("Plot update at index", datasetIndex);
      })
      .catch((e) => {
        console.log(`Failed to update plot at index ${datasetIndex}, ${e}`);
      });
  }

  removeDatasetByName(name: string): void {
    const datasetIndex = this.getDatasetIndex(name);
    this.removeDataset(datasetIndex, false);
  }

  removeDataset(datasetIndex: number, undo?: boolean): void {
    const {
      label,
      pv: { optimized },
    } = this.chartjs.getDatasetSettingsByIndex(datasetIndex);

    if (!undo || undo === undefined) {
      this.stack.undoStackPush({
        action: StackActionEnum.REMOVE_PV,
        pv: label,
        optimized: optimized,
      });
    }

    this.chartjs.removeDataset(datasetIndex);
    this.updateURL();
    this.updateOptimizedWarning();
  }

  toggleAxisType(axisId: string): void {
    this.chartjs.toggleAxisType(axisId);
    //   return chartUtils.toggleAxisType(this.chart, axisId);
  }

  hideDataset(label: string): void {
    this.chartjs.hideDataset(label);
    /*   const datasetIndex = this.getDatasetIndex(label);
    if (datasetIndex === undefined || datasetIndex === null) {
      return;
    }
    return hideDatasetByIndex(this.chart, datasetIndex, label);*/
  }

  toggleSingleTip(): void {
    this.setSingleTipEnabled(!this.isSingleTipEnabled());
    this.chartjs.toggleTooltipBehavior(this.isSingleTipEnabled());

    Browser.setCookie("singleTip", this.isSingleTipEnabled() ? "true" : "false", 1);

    /*   this.setSingleTipEnabled(!this.isSingleTipEnabled());
    chartUtils.toggleTooltipBehavior(this.chart, this.isSingleTipEnabled());
    */
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
    ChartDispatcher.setZooming(true);
  }

  disableZoom() {
    this.zoomFlags.isZooming = false;
    ChartDispatcher.setZooming(false);
  }
}

const chartEntity = new ChartImpl();
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
