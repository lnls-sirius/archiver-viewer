/* eslint-disable radix */

import archInterface from "../../data-access";
import chartUtils, { DefaultBinSize } from "../../utility/chartUtils";
import { RequestsDispatcher, StatusDispatcher, ChartDispatcher } from "../../utility/Dispatchers";
import Browser from "../../utility/Browser";
import { fixOutOfRangeData } from "../../utility/data";
import Chart from "chart.js";

import ChartInterface from "./interface";

import makeChartActionsStack, { StackActionEnum, StackAction, ChartActionsStack } from "./StackAction";
import makeAutoUpdate, { AutoUpdate } from "./AutoUpdate";
import makeChartTime, { ChartTime } from "./Time";
import { CreateChartJSController, ChartJSController, DatasetInfo } from "./ChartJS";
import { ArchiverDataPoint, ArchiverMetadata } from "../../data-access/interface";
import { OptimizeDataError, OutOfSyncDatasetError } from "../../utility/errors";
import { Settings, SettingsPVs } from "../../utility/Browser/interface";

export enum REFERENCE {
  START = 0,
  END = 1,
}

interface ZoomFlags {
  isZooming: boolean;
  hasBegan: boolean;
}

class ChartImpl implements ChartInterface {
  /* chartjs instance reference */
  private chart: Chart = null;
  private reference = REFERENCE.END; // Reference time end
  private windowTime = chartUtils.timeIDs.MIN10;

  private autoUpdate: AutoUpdate; // Auto update module

  private singleTipEnabled = true;
  private serverDateEnabled = false;

  private cachedDate: Date = null;
  private lastFetch: Date = null;

  private datasetLatestFetchRequestTime: { [key: string]: any };
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
    this.autoUpdate = makeAutoUpdate(async () => await this.autoUpdateFunction());
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
    this.chartjs = CreateChartJSController(c);
    this.loadTooltipSettings();
  }

  update(settings: Chart.ChartUpdateProps = { lazy: false, duration: 0, easing: "linear" }) {
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
    this.updateOptimizedWarning();

    this.updateURL();
    const promises: Promise<void>[] = [];
    this.chart.data.datasets.forEach(async (dataset, datasetIndex) => {
      const {
        label,
        pv: { optimized },
      } = this.chartjs.getDatasetSettingsByIndex(datasetIndex);
      if (optimized) {
        dataset.data = [];
      }
      const promise = this.updatePlot(datasetIndex, { waitResult: true });
      console.log(`Auto update ${datasetIndex}: ${label}`);
      promises.push(promise);
    });

    await Promise.all(promises)
      .then(() => {
        this.update({ lazy: false, easing: "linear" });
      })
      .catch((e) => {
        const msg = `Failed to update all plots ${e}`;
        console.error(msg, e);
        StatusDispatcher.Warning("Auto update", msg);
      });
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

    await this.updateAllPlots(true);
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
    const maxPoints = DefaultBinSize; // Hardcoded...

    if (estimateSamples > maxPoints) {
      return maxPoints;
    }

    return -1;
  }

  async updateEndTime(date: Date, now: Date): Promise<void> {
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

  async fetchDatasetData(
    start: Date,
    end: Date,
    { label, pv: { optimized, bins } }: DatasetInfo | { label: string; pv: { optimized: boolean; bins: number } }
  ): Promise<ArchiverDataPoint[]> {
    RequestsDispatcher.IncrementActiveRequests();
    const thisDatasetRequestTime = new Date().getTime();

    /* @todo: Cancel previous requests that are deemed invalid  https://github.com/axios/axios#cancellation
    This should be included at the data-access module, as a method. */
    this.datasetLatestFetchRequestTime[label] = thisDatasetRequestTime;

    try {
      const { data } = await archInterface.fetchData(label, start, end, optimized, bins);
      const isTheLatestFetchRequest = this.datasetLatestFetchRequestTime[label] === thisDatasetRequestTime;

      if (isTheLatestFetchRequest) {
        this.datasetLatestFetchRequestTime[label] = null;
        return data;
      }
      throw new OutOfSyncDatasetError(`Request ${label} is too late and should be discarded`);
    } finally {
      RequestsDispatcher.DecrementActiveRequests();
    }
  }

  async fetchDatasetDataOrOptimize(start: Date, end: Date, datasetInfo: DatasetInfo): Promise<ArchiverDataPoint[]> {
    const { label } = datasetInfo;

    try {
      return await this.fetchDatasetData(start, end, datasetInfo);
    } catch (e) {
      if (e instanceof OptimizeDataError) {
        this.chartjs.setDatasetOptimized(label, false);
        return await this.fetchDatasetData(start, end, datasetInfo);
      }

      throw e;
    }
  }

  async updateDatasetData(
    datasetIndex: number,
    data: ArchiverDataPoint[],
    { fixOutOfRange, update } = { fixOutOfRange: true, update: true }
  ): Promise<void> {
    const dataset = this.chartjs.getDatasetByIndex(datasetIndex);

    dataset.data = fixOutOfRange ? fixOutOfRangeData(data, this.getStart(), this.getEnd()) : data;
    if (update) {
      this.chartjs.update();
    }
  }

  async updateEmptyDataset(datasetIndex: number) {
    const settings = this.chartjs.getDatasetSettingsByIndex(datasetIndex);

    try {
      await this.fetchDatasetDataOrOptimize(this.time.getStart(), this.time.getEnd(), settings).then((data) => {
        this.updateDatasetData(datasetIndex, data);
      });
    } catch (e) {
      if (e instanceof OutOfSyncDatasetError) {
        console.info(`Ignoring Archiver response ${e}`);
        return;
      }
      const msg = `Failed to fetch ${settings.label} data, error ${e}`;
      StatusDispatcher.Error("Archiver data acquisition", msg);
      console.error(msg);
    }
  }

  async trimmDatasetData(datasetIndex: number) {
    const dataset = this.chart.data.datasets[datasetIndex];
    const data = dataset.data as ArchiverDataPoint[];

    // Gets the time of the first and last element of the dataset
    const first = data[0].x;
    const last = data[data.length - 1].x;

    const startTime = this.time.getStart().getTime();
    const endTime = this.time.getEnd().getTime();

    const trimDatasetStart = () => {
      while (data.length > 1 && data[0].x.getTime() < startTime) {
        data.shift();
      }
    };

    const trimDatasetEnd = () => {
      for (let i = data.length - 1; data.length > 1 && data[i].x.getTime() > endTime; i--) {
        data.pop();
      }
    };

    // we need to append data to the beginning of the data set
    const isFistPointAfterTheStart = first.getTime() > startTime;
    if (isFistPointAfterTheStart) {
      // Fetches data from the start to the first measure's time
      await this.fillDataFromStartFirst(datasetIndex, first);
    } else {
      trimDatasetStart();
    }

    // we need to append data to the end of the data set
    const isLastPointBeforeTheEnd = last.getTime() < endTime;
    if (isLastPointBeforeTheEnd) {
      await this.fillDataFromLastToEnd(datasetIndex, last);
    } else {
      trimDatasetEnd();
    }
  }

  async updateDataset(datasetIndex: number) {
    const dataset = this.chart.data.datasets[datasetIndex];

    await this.trimmDatasetData(datasetIndex)
      .then(() => {
        const _data = fixOutOfRangeData(dataset.data as ArchiverDataPoint[], this.getStart(), this.getEnd());
        dataset.data = _data;

        if (dataset.data.length === 0) {
          StatusDispatcher.Info(
            `Empty dataset ${dataset.label}`,
            `No data available for the time interval [${this.time.getStart()}, ${this.time.getEnd()}]`
          );
        }
      })
      .catch((e) => {
        if (e instanceof OutOfSyncDatasetError) {
          // console.log(`Ignoring `)
        } else {
          throw e;
        }
      });
  }

  async updatePlot(datasetIndex: number, settings = { waitResult: false }): Promise<void> {
    // If the dataset is already empty, no verification is needed. All optimized request must be pass this condition.
    const dataset = this.chart.data.datasets[datasetIndex];
    const { waitResult } = settings;

    if (waitResult) {
      /* @todo: Optimized datasets should always go here... */
      if (dataset.data.length === 0) {
        await this.updateEmptyDataset(datasetIndex);
      } else {
        await this.updateDataset(datasetIndex);
      }
      return;
    }

    /* @todo: Optimized datasets should always go here... */
    if (dataset.data.length === 0) {
      this.updateEmptyDataset(datasetIndex);
    } else {
      this.updateDataset(datasetIndex);
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

  private async fillDataFromLastToEnd(datasetIndex: number, last: Date) {
    const {
      label,
      pv: { bins },
    } = this.chartjs.getDatasetSettingsByIndex(datasetIndex);

    await this.fetchDatasetData(last, this.time.getEnd(), {
      label,
      pv: { optimized: false, bins },
    }).then((data) => {
      const dataset = this.chart.data.datasets[datasetIndex];

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

        dataset.data = [...dataset.data, ...(data as any)]; // .unshift(...(data as any));
      }
    });
  }

  private async fillDataFromStartFirst(datasetIndex: number, first: Date) {
    const {
      label,
      pv: { bins },
    } = this.chartjs.getDatasetSettingsByIndex(datasetIndex);

    await this.fetchDatasetData(this.time.getStart(), first, {
      label,
      pv: { optimized: false, bins },
    }).then((data) => {
      const dataset = this.chart.data.datasets[datasetIndex];
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
        dataset.data = [...(data as any), ...dataset.data]; // .unshift(...(data as any));
      }
    });
  }

  /**
   * Updates all plots added so far.
   * @param resets: informs if the user wants to reset the data in the dataset.
   **/
  async updateAllPlots(reset = false, chartUpdate = true): Promise<any> {
    this.updateOptimizedWarning();

    const promises: Promise<void>[] = [];
    this.chart.data.datasets.map(async (dataset, i) => {
      const label = dataset.label;

      if (this.chartjs.getDatasetSettings(label).pv.optimized || reset) {
        dataset.data = [];
      }

      promises.push(
        this.updatePlot(i, { waitResult: true }).then(() => {
          if (chartUpdate) {
            this.update();
          }
        })
      );
    });

    await Promise.all(promises)
      .catch((error) => {
        console.error(`Failed to update all plots ${error.message}`, error);
      })
      .finally(() => {
        this.updateURL();
        if (chartUpdate) {
          this.update();
        }
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
  }

  toggleSingleTip(): void {
    this.setSingleTipEnabled(!this.isSingleTipEnabled());
    this.chartjs.toggleTooltipBehavior(this.isSingleTipEnabled());

    Browser.setCookie("singleTip", this.isSingleTipEnabled() ? "true" : "false", 1);
  }
  getDatasets() {
    return this.chartjs.getDatasets();
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
  
  enableZoom() {
    this.zoomFlags.isZooming = true;
    ChartDispatcher.setZooming(true);
  }

  disableZoom() {
    this.zoomFlags.isZooming = false;
    ChartDispatcher.setZooming(false);
  }
}

export function CreateChartEntity(): ChartImpl {
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
  return chartEntity;
}

// export default chartEntity;
