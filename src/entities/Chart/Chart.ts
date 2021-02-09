/* eslint-disable radix */

import archInterface from "../../data-access";
import chartUtils, { hideDatasetByLabel, findAxisIndexById } from "../../utility/chartUtils";
import { StatusDispatcher } from "../../utility/Dispatchers";
import { StackAction as STACK_ACTIONS } from "../../controllers/ActionsStack/constants";
import Browser from "../../utility/Browser";
import makeAutoUpdate from "./AutoUpdate";
import store from "../../store";
import {
  setDatasetOptimized,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setTimeStart,
  setWindowTime,
  setZooming,
  removeDataset as storeRemoveDataset,
} from "../../features/chart/sliceChart";
import Chart from "chart.js";
import AutoUpdate from "./AutoUpdate/interface";

export enum REFERENCE {
  START = 0,
  END = 1,
}

interface DragFlags {
  dragStarted: boolean;
  updateOnComplete: boolean;
  endTime?: Date;
  x?: number;
}
interface ZoomFlags {
  isZooming: boolean;
  hasBegan: boolean;
}
interface StackAction {
  action: STACK_ACTIONS;
  pv?: string;
  endTime?: Date;
  startTime?: Date;
  optimized?: boolean;
  windowTime?: number;
}

class ChartImpl {
  /* chartjs instance reference */
  private chart: Chart = null;
  private start: Date;
  private end: Date;
  private reference = REFERENCE.END; // Reference time end
  private windowTime = chartUtils.timeIDs.MIN10;

  private AutoUpdate: AutoUpdate; // Auto update module

  private singleTipEnabled = true;
  private scrollingEnabled = true;
  private serverDateEnabled = true;

  private cachedDate: Date = null;
  private lastFetch: Date = null;

  private dragFlags: DragFlags = {
    dragStarted: false,
    updateOnComplete: true,
    endTime: undefined,
  };

  private undoStack: StackAction[];
  private redoStack: StackAction[];

  private datasetLatestFetchRequestTime: { [key: number]: any };

  private zoomFlags: ZoomFlags = {
    isZooming: false,
    hasBegan: false,
  };

  constructor() {
    this.AutoUpdate = makeAutoUpdate(async () => {
      this.autoUpdateFunction();
    });

    this.redoStack = [];
    this.undoStack = [];

    this.datasetLatestFetchRequestTime = {};
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
    store.dispatch(setTimeStart(time.toString()));
    this.start = time;
  }

  setEnd(time: Date): void {
    store.dispatch(setTimeEnd(time.toString()));
    this.end = time;
  }

  updateTimeWindowOnly(time: number): void {
    this.windowTime = time;
    store.dispatch(setWindowTime(this.windowTime));
  }

  /* Control flags */
  // -----------------------------------------------------------
  isAutoUpdateEnabled(): boolean {
    return this.AutoUpdate.isEnabled();
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
      this.start,
      this.end
    );
    this.updateURL();
    await this.updateAllPlots(false);
  }
  toggleAutoUpdate(): void {
    this.AutoUpdate.toggle();
  }
  // -----------------------------------------------------------

  updateTimeReference(r: number): void {
    this.reference = r;
    store.dispatch(setTimeReferenceEnd(this.reference));
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
    this.doSubscriptions();
    this.loadTooltipSettings();
  }

  private doSubscriptions() {
    store.subscribe(() => {
      /** Chart Min/Max Limits */
      const dataAxis = store.getState().chart.dataAxis;

      dataAxis.forEach(({ id, yLimitManual, yMin, yMax }) => {
        let updateChart = false;

        const i = findAxisIndexById(this.chart, id);
        if (i === null) {
          return;
        }
        const axis = this.chart.options.scales.yAxes[i];

        if (!yLimitManual) {
          delete axis.ticks.max;
          delete axis.ticks.min;
          updateChart = true;
        } else {
          if (yMin && (!("min" in axis.ticks) || ("min" in axis.ticks && yMin !== axis.ticks.min))) {
            updateChart = true;
            axis.ticks.min = yMin;
          }
          if (yMax && (!("max" in axis.ticks) || ("max" in axis.ticks && yMax !== axis.ticks.max))) {
            updateChart = true;
            axis.ticks.max = yMax;
          }
        }
        if (updateChart) {
          this.chart.update();
        }
      });
    });
  }

  async updateTimeWindow(window: number): Promise<void> {
    this.updateTimeWindowOnly(window);

    if (this.windowTime < chartUtils.timeIDs.MIN_30) {
      if (this.AutoUpdate.isEnabled()) {
        this.AutoUpdate.setDisabled();
      }
    }

    if (this.reference === REFERENCE.END) {
      this.start = new Date(this.end.getTime() - chartUtils.timeAxisPreferences[this.windowTime].milliseconds);
    } else if (this.reference === REFERENCE.START) {
      const now = await this.getDateNow();

      if (this.start.getTime() + chartUtils.timeAxisPreferences[this.windowTime].milliseconds <= now.getTime()) {
        this.end = new Date(this.start.getTime() + chartUtils.timeAxisPreferences[this.windowTime].milliseconds);
      } else {
        this.end = now;
      }
    }

    this.optimizeAllGraphs();
    this.updateAllPlots(true);
    this.updateURL();
    chartUtils.updateTimeAxis(
      this.chart,
      chartUtils.timeAxisPreferences[this.windowTime].unit,
      chartUtils.timeAxisPreferences[this.windowTime].unitStepSize,
      this.start,
      this.end
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
    if (!this.end) {
      newEnd = date;
    }
    if (date.getTime() <= now.getTime()) {
      newEnd = date;
    } else {
      newEnd = now;
    }
    const newStartDate = new Date(newEnd.getTime() - chartUtils.timeAxisPreferences[this.windowTime].milliseconds);

    if (newEnd) {
      this.end = newEnd;
    }
    this.start = newStartDate;
  }

  async updateStartTime(date: Date, now: Date) {
    let newStart;
    let newEnd;

    if (!this.start) {
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
      this.start = newStart;
    }
    if (newEnd) {
      this.end = newEnd;
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
        this.undoStack.push({ action: STACK_ACTIONS.CHANGE_END_TIME, endTime: this.end });
      }
      await this.updateEndTime(date, now);
    } else {
      if (undo) {
        this.undoStack.push({ action: STACK_ACTIONS.CHANGE_START_TIME, startTime: this.start });
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

      if (first.x.getTime() > this.start.getTime()) {
        unshiftData.push({
          x: this.start,
          y: first.y,
        });
      }

      if (last.x.getTime() < this.end.getTime()) {
        data.push({
          x: this.end,
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
      .fetchData(dataset.label, this.start, this.end, (dataset as any).pv.optimized, bins)
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
    if (dataset.data.length === 0) {
      return await this.updateEmptyDataset(datasetIndex, dataset);
    }

    // Gets the time of the first and last element of the dataset
    const first = (dataset.data[0] as any).x;
    const last = (dataset.data[dataset.data.length - 1] as any).x;

    const trimDatasetStart = () => {
      while (dataset.data.length > 0 && (dataset.data[0] as any).x.getTime() < this.start.getTime()) {
        dataset.data.shift();
      }
    };

    function trimDatasetEnd() {
      for (
        let i = dataset.data.length - 1;
        dataset.data.length > 0 && (dataset.data[i] as any).x.getTime() > this.end.getTime();
        i--
      ) {
        dataset.data.pop();
      }
    }

    // we need to append data to the beginning of the data set
    const isFistPointAfterTheStart = first.getTime() > this.start.getTime();
    if (isFistPointAfterTheStart) {
      // Fetches data from the start to the first measure's time
      await this.fillDataFromStartFirst(dataset, first);
    } else {
      trimDatasetStart();
    }

    // we need to append data to the end of the data set
    const isLastPointBeforeTheEnd = last.getTime() < this.end.getTime();
    if (isLastPointBeforeTheEnd) {
      await this.fillDataFromLastToEnd(dataset, last);
    } else {
      trimDatasetEnd();
    }

    this.improveData(dataset.data);
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
      .fetchData(pvName, last, this.end, false)
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
        const msg = `Failed to fill data from ${pvName} [${last} to ${this.end}], error ${e}`;
        console.error(msg);
        StatusDispatcher.Error("Fetch data", msg);
      });
  }

  async fillDataFromStartFirst(dataset: Chart.ChartDataSets, first: Date) {
    const pvName = dataset.label;
    await archInterface
      .fetchData(dataset.label, this.start, first, false)
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
        const msg = `Failed to fill data from ${pvName} [${this.start} to ${first}], error ${e}`;
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
        this.chart.update();
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
    Browser.updateAddress(datasets, bins, this.start, this.end);
  }

  getNewTimeWindow(): number {
    const endTime = this.end.getTime();
    const startTime = this.start.getTime();

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
        this.chart.update();
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
      this.undoStack.push({
        action: STACK_ACTIONS.REMOVE_PV,
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
    this.chart.update({ duration: 0, lazy: false, easing: "linear" });
    this.updateURL();
    this.updateOptimizedWarning();

    store.dispatch(storeRemoveDataset({ idx: datasetIndex, removeAxis: removeAxis }));
  }

  hideAxis(event: { data: { datasetIndex: number } }): void {
    chartUtils.hidesAxis(this.chart.getDatasetMeta(event.data.datasetIndex), this.chart);
    this.chart.update({ duration: 0, lazy: false, easing: "linear" });
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
    return this.start;
  }
  getEnd(): Date {
    return this.end;
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
    return this.redoStack.pop();
  }
  redoStackPush(state: StackAction): void {
    this.redoStack.push(state);
  }

  undoStackPop(): StackAction {
    return this.undoStack.pop();
  }
  undoStackPush(state: StackAction): void {
    this.undoStack.push(state);
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

  startDrag() {
    this.dragFlags.dragStarted = true;
  }
  stopDrag() {
    this.dragFlags.dragStarted = false;
  }
  updateDragEndTime(t: Date) {
    this.dragFlags.endTime = t;
  }
  updateDragOffsetX(x: number): void {
    this.dragFlags.x = x;
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

const originalGetPixelForValue = (Chart.scaleService as any).constructors.linear.prototype.getPixelForValue;
(Chart.scaleService as any).constructors.linear.prototype.getPixelForValue = function (value: any) {
  const pixel = originalGetPixelForValue.call(this, value);
  return Math.min(2147483647, Math.max(-2147483647, pixel));
};

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
