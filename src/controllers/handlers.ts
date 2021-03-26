import control, { REFERENCE } from "../entities/Chart";
import chartUtils from "../utility/chartUtils";
import { StackActionEnum } from "../entities/Chart/StackAction/constants";
import QueryPVs from "../use-cases/QueryPVs";
import PlotPVs from "../use-cases/PlotPVs";
import ExportDataset from "../use-cases/ExportDataset";
import { StatusDispatcher } from "../utility/Dispatchers";

async function exportAsXlsx(): Promise<void> {
  await ExportDataset.asXlsx();
}

/**
 * Updates the chart after a date is chosen by the user.
 **/
async function onChangeDateHandler(date: Date): Promise<void> {
  const newDate = date;

  await control.updateStartAndEnd(newDate);

  control.updateAllPlots(true);
  control.updateTimeAxis();
}

/**
 * Chooses whether the next request for the archiver will be optimized (to reduce the big amount of data) or raw.
 **/
function updateTimeWindow(timeId: number): void {
  control.undoStackPush({
    action: StackActionEnum.CHANGE_WINDOW_TIME,
    windowTime: control.getWindowTime(),
  });
  control.updateTimeWindow(timeId);
}

/**
 * Updates control.end () to the present instant and redraws all plots
 **/
async function updateEndNow(): Promise<void> {
  if (!control.isAutoUpdateEnabled()) {
    if (control.getReference() === REFERENCE.START) {
      control.updateTimeReference(REFERENCE.END);
    }

    const now = await control.getDateNow();

    await control.updateStartAndEnd(now);
    control.updateTimeAxis();
    control.updateAllPlots(true);
  }
}

/**
 * Sets control.end () to control.start () and redraws all plots. In other
 * other words, it regresses the time window size into the past.
 **/
async function backTimeWindow(): Promise<any> {
  if (!control.isAutoUpdateEnabled()) {
    let date = control.getStart();
    if (control.getReference() === REFERENCE.END) {
      date = control.getEnd();
    }

    const windowTime = control.getWindowTime();
    const { milliseconds } = chartUtils.timeAxisPreferences[windowTime];

    await control.updateStartAndEnd(new Date(date.getTime() - milliseconds));

    control.updateTimeAxis();
    control.updateAllPlots(true);
  }
}

/**
 * Sets control.start () to control.end () and redraws all plots.
 **/
async function forwTimeWindow(): Promise<any> {
  if (!control.isAutoUpdateEnabled()) {
    const windowTime = control.getWindowTime();
    const { milliseconds } = chartUtils.timeAxisPreferences[windowTime];

    let date: Date;
    if (control.getReference() === REFERENCE.END) {
      date = control.getEnd();
    } else {
      date = control.getStart();
    }

    await control.updateStartAndEnd(new Date(date.getTime() + milliseconds));

    control.updateTimeAxis();
    control.updateAllPlots(true);
  }
}

async function queryPVsRetrieval(val: string): Promise<void> {
  QueryPVs(val);
}

function plotSelectedPVs(pvs: { name: string; optimize: boolean }[]): void {
  PlotPVs.plot(pvs);
}

/** ***** Scrolling function *******/
/**
 * The following function manages mouse wheel events in the canvas area
 **/
function scrollChart(deltaY: number): void {
  if (control.isScrollingEnabled()) {
    const windowTime = control.getWindowTime();
    //     control.enableLoading();
    control.disableScrolling();
    const windowTimeNew =
      deltaY > 0 ? Math.max(windowTime - 1, 0) : Math.min(windowTime + 1, chartUtils.timeIDs.SEG_30);
    if (windowTimeNew !== windowTime) {
      control.updateTimeWindow(windowTimeNew);
    }
    //   control.disableLoading();
    control.enableScrolling();
  }
}

async function singleTipHandler(): Promise<void> {
  control.toggleSingleTip();
}

function closestDateValue(searchDate: any, dates: any[]) {
  if (searchDate - dates[0] <= 0) {
    return 0;
  } else if (searchDate - dates[dates.length - 1] >= 0) {
    return dates.length - 1;
  }

  let first = 0;
  let last = dates.length - 1;
  let middle;

  while (first <= last) {
    middle = Math.floor((first + last) / 2);

    if (dates[middle] === searchDate) {
      return middle;
    }

    if (first === middle) {
      return first < searchDate ? first : first - 1;
    }

    if (dates[middle] > searchDate) {
      last = middle - 1;
    } else {
      first = middle + 1;
    }
  }
}

function tooltipColorHandler(tooltip: any): void {
  if (tooltip.dataPoints !== undefined && !control.isSingleTipEnabled()) {
    let i;
    tooltip.labelColors = [];
    tooltip.labelTextColors = [];
    for (i = 0; i < tooltip.dataPoints.length; i++) {
      if (tooltip.dataPoints[i] !== undefined) {
        tooltip.labelColors.push({
          backgroundColor: tooltip.dataPoints[i].backgroundColor || "#fff",
          borderColor: tooltip.dataPoints[i].borderColor || "#fff",
        });
        tooltip.labelTextColors.push("#fff");
      }
    }
  }
}

/*
 * Handles tooltip item list correction and addition
 */
function bodyCallback(labels: any, chart: any) {
  if (control.isSingleTipEnabled() || labels[0] === undefined) {
    return;
  }
  const drawnDatasets = labels.map((x: any) => x.datasetIndex);
  const masterSet = labels[0].datasetIndex;
  const stringDate = labels[0].xLabel.substring(0, 23);

  labels[0].backgroundColor = chart.datasets[masterSet].backgroundColor;
  labels[0].borderColor = chart.datasets[masterSet].borderColor;

  const masterDate = new Date(stringDate);
  let index = 1;

  for (let i = 0; i < chart.datasets.length; i++) {
    if (i !== masterSet) {
      const closest = closestDateValue(
        masterDate,
        chart.datasets[i].data.map((x: any) => x.x)
      );

      if (chart.datasets[i].data[closest] === undefined) {
        return "Loading datasets...";
      }

      if (drawnDatasets.includes(i)) {
        labels[index].yLabel = chart.datasets[i].data[closest].y;
        labels[index].x = labels[0].x;
        labels[index].y = chart.datasets[i].data[closest].y;
        labels[index].backgroundColor = chart.datasets[i].backgroundColor;
        labels[index].borderColor = chart.datasets[i].borderColor;
        index++;
      } else {
        labels.push({
          datasetIndex: i,
          index: closest,
          label: chart.datasets[i].data[closest].x.toString(),
          value: chart.datasets[i].data[closest].y.toString(),
          x: labels[0].x,
          xLabel: labels[0].xLabel,
          y: labels[0].y,
          yLabel: chart.datasets[i].data[closest].y * 1,
          backgroundColor: chart.datasets[i].backgroundColor || "#fff",
          borderColor: chart.datasets[i].borderColor || "#fff",
        });
      }
    }
  }

  labels.sort(function (a: any, b: any) {
    return a.datasetIndex - b.datasetIndex;
  });
}

/**
 * Enables or disables plot auto refreshing.
 **/
async function autoUpdateHandler(): Promise<void> {
  control.toggleAutoUpdate();
}

/** ***** Dragging and zoom functions *******/

/**
 * Adjusts the global variables to perform a zoom in the chart.
 **/
function zoomClickHandler(): void {
  if (control.isAutoUpdateEnabled()) {
    StatusDispatcher.Warning("Zoom disabled", "Cannot zoom while auto update is enabled");
    return;
  }
  if (control.getZoomFlags().isZooming) {
    control.disableZoom();
  } else {
    control.enableZoom();
  }
}

async function undoHandler(): Promise<void> {
  // the undo action does the opposite of the action
  if (!control.isAutoUpdateEnabled()) {
    const undo = control.undoStackPop();
    if (undo === undefined) {
      return;
    }

    switch (undo.action) {
      case StackActionEnum.REMOVE_PV:
        // 1- Add the PV back
        control.redoStackPush({ action: StackActionEnum.REMOVE_PV, pv: undo.pv });
        PlotPVs.plotPV({ name: undo.pv, optimize: undo.optimized });
        control.undoStackPush({ action: StackActionEnum.APPEND_PV, pv: undo.pv });
        break;

      case StackActionEnum.APPEND_PV: {
        // Remove the PV
        const index = control.getPlotIndex(undo.pv);
        const optimized = (control.getChart().data.datasets[index] as any).pv.optimized;
        control.redoStackPush({
          action: StackActionEnum.APPEND_PV,
          pv: undo.pv,
          optimized,
        });
        control.removeDataset(index, true);
        break;
      }

      case StackActionEnum.CHANGE_WINDOW_TIME: {
        control.redoStackPush({
          action: StackActionEnum.CHANGE_WINDOW_TIME,
          windowTime: control.getWindowTime(),
        });
        control.updateTimeWindow(undo.windowTime);
        break;
      }

      case StackActionEnum.CHANGE_END_TIME: {
        control.redoStackPush({
          action: StackActionEnum.CHANGE_END_TIME,
          endTime: control.getEnd(),
        });
        control.updateTimeReference(REFERENCE.END);
        await control.updateStartAndEnd(undo.endTime, true);
        // does not change the time window, only updates all plots
        control.updateTimeWindow(control.getWindowTime());
        break;
      }

      case StackActionEnum.CHANGE_START_TIME: {
        control.redoStackPush({
          action: StackActionEnum.CHANGE_START_TIME,
          startTime: control.getStart(),
        });

        control.updateTimeReference(REFERENCE.START);
        await control.updateStartAndEnd(undo.startTime, true);
        // does not change the time window, only updates all plots
        control.updateTimeWindow(control.getWindowTime());
        break;
      }

      case StackActionEnum.ZOOM:
        control.redoStackPush({
          action: StackActionEnum.ZOOM,
          startTime: control.getStart(),
          endTime: control.getEnd(),
          windowTime: control.getWindowTime(),
        });

        await control.updateStartAndEnd(undo.endTime, true);
        control.updateTimeWindow(undo.windowTime);
        break;
    }
    control.update({ duration: 0, easing: "linear", lazy: false });
  }
}

async function redoHandler(): Promise<void> {
  if (!control.isAutoUpdateEnabled()) {
    const redo = control.redoStackPop();
    if (redo === undefined) {
      return;
    }

    switch (redo.action) {
      case StackActionEnum.REMOVE_PV:
        control.removeDataset(control.getPlotIndex(redo.pv));
        break;

      case StackActionEnum.APPEND_PV:
        PlotPVs.plotPV({ name: redo.pv, optimize: redo.optimized });
        break;

      case StackActionEnum.CHANGE_WINDOW_TIME:
        control.updateTimeWindow(redo.windowTime);
        break;

      case StackActionEnum.CHANGE_START_TIME: {
        control.updateTimeReference(REFERENCE.START);

        await control.updateStartAndEnd(redo.startTime);
        control.updateAllPlots(true);
        control.updateTimeAxis();
        break;
      }
      case StackActionEnum.CHANGE_END_TIME: {
        control.updateTimeReference(REFERENCE.END);

        await control.updateStartAndEnd(redo.endTime, true);
        control.updateAllPlots(true);
        control.updateTimeAxis();

        break;
      }
      case StackActionEnum.ZOOM: {
        // Updates the chart attributes
        control.setStart(redo.startTime);
        control.setEnd(redo.endTime);

        control.updateTimeAxis();
        control.updateOptimizedWarning();
        break;
      }
    }

    control.update({ duration: 0, easing: "linear", lazy: false });
  }
}

function updateReferenceTime(isEndSelected: boolean): void {
  if (isEndSelected) {
    control.updateTimeReference(REFERENCE.END);
  } else {
    control.updateTimeReference(REFERENCE.START);
  }
}

export default {
  bodyCallback,
  tooltipColorHandler,
  onChangeDateHandler,
  updateTimeWindow,
  updateEndNow,
  backTimeWindow,
  forwTimeWindow,
  queryPVsRetrieval,
  plotSelectedPVs,
  scrollChart,
  autoUpdateHandler,
  singleTipHandler,

  zoomClickHandler,

  exportAsXlsx,
  undoHandler,
  redoHandler,
  updateReferenceTime,
};
