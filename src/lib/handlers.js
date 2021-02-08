import chartUtils from "../utility/chartUtils";
import control from "../entities/Chart/Chart.js";

import { StackAction } from "../controllers/ActionsStack/ActionsStackConstants";
import QueryPVs from "../use-cases/QueryPVs";
import PlotPVs from "../use-cases/PlotPVs";
import ExportDataset from "../use-cases/ExportDataset";

const handlers = (function () {
  const KEY_ENTER = 13;

  const exportAs = async (t) => {
    await ExportDataset.asXlsx(t);
  };

  /**
   * Updates the chart after a date is chosen by the user.
   **/
  async function onChangeDateHandler(date) {
    const newDate = date;

    await control.updateStartAndEnd(newDate);

    control.updateAllPlots(true);
    control.updateURL();

    chartUtils.updateTimeAxis(
      control.chart(),
      chartUtils.timeAxisPreferences[control.windowTime()].unit,
      chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
      control.start(),
      control.end()
    );
  }

  /**
   * updateTimeWindow is called when a button event in one of the time window options is captured.
   * Sets control.start () accoording to this new time window and updates the Chartjs
   * by calling plot-related functions.
   * Chooses whether the next request for the archiver will be optimized (to reduce the big amount of data) or raw.
   **/
  const updateTimeWindow = function (timeId) {
    control.undoStack().push({
      action: StackAction.CHANGE_WINDOW_TIME,
      window: control.windowTime(),
    });
    control.updateTimeWindow(timeId);
  };

  /**
   * Updates control.end () to the present instant and redraws all plots
   **/
  async function updateEndNow() {
    if (!control.isAutoUpdateEnabled()) {
      if (control.reference() === control.references.START) {
        control.updateTimeReference(control.references.END);
      }

      const now = await control.getDateNow();

      await control.updateStartAndEnd(now);

      chartUtils.updateTimeAxis(
        control.chart(),
        chartUtils.timeAxisPreferences[control.windowTime()].unit,
        chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
        control.start(),
        control.end()
      );

      control.updateAllPlots(true);
      control.updateURL();
    }
  }

  /**
   * Sets control.end () to control.start () and redraws all plots. In other
   * other words, it regresses the time window size into the past.
   **/
  async function backTimeWindow(button) {
    if (!control.isAutoUpdateEnabled()) {
      let date = control.start();
      if (control.reference() === control.references.END) {
        date = control.end();
      }

      await control.updateStartAndEnd(
        new Date(date.getTime() - chartUtils.timeAxisPreferences[control.windowTime()].milliseconds)
      );

      chartUtils.updateTimeAxis(
        control.chart(),
        chartUtils.timeAxisPreferences[control.windowTime()].unit,
        chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
        control.start(),
        control.end()
      );

      control.updateAllPlots(true);
      control.updateURL();
    }
  }

  /**
   * Sets control.start () to control.end () and redraws all plots.
   **/
  async function forwTimeWindow(button) {
    if (!control.isAutoUpdateEnabled()) {
      let date = control.start();
      if (control.reference() === control.references.END) {
        date = control.end();
      }

      await control.updateStartAndEnd(
        new Date(date.getTime() + chartUtils.timeAxisPreferences[control.windowTime()].milliseconds)
      );

      chartUtils.updateTimeAxis(
        control.chart(),
        chartUtils.timeAxisPreferences[control.windowTime()].unit,
        chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
        control.start(),
        control.end()
      );

      control.updateAllPlots(true);
      control.updateURL();

      control.disableLoading();
    }
  }

  async function queryPVsRetrieval(e, val) {
    if (e.which !== KEY_ENTER) {
      return;
    }
    QueryPVs(val);
  }

  const plotSelectedPVs = (pvs) => {
    PlotPVs.plot(pvs);
  };

  /** ***** Scrolling function *******/
  /**
   * The following function manages mouse wheel events in the canvas area
   **/
  const scrollChart = function (evt) {
    if (control.scrollingEnabled()) {
      //     control.enableLoading();
      control.disableScrolling();
      const windowTimeNew =
        evt.deltaY > 0
          ? Math.max(control.windowTime() - 1, 0)
          : Math.min(control.windowTime() + 1, chartUtils.timeIDs.SEG_30);
      if (windowTimeNew !== control.windowTime()) {
        control.updateTimeWindow(windowTimeNew);
      }
      //   control.disableLoading();
      control.enableScrolling();
    }
  };

  async function singleTipHandler(e) {
    control.toggleSingleTip();
    return control.singleTipEnabled();
  }

  function closestDateValue(searchDate, dates) {
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

  const tooltipColorHandler = function (tooltip) {
    if (tooltip.dataPoints !== undefined && !control.singleTipEnabled()) {
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
  };

  /*
   * Handles tooltip item list correction and addition
   */
  const bodyCallback = function (labels, chart) {
    if (control.singleTipEnabled() || labels[0] === undefined) {
      return;
    }
    const drawnDatasets = labels.map((x) => x.datasetIndex);
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
          chart.datasets[i].data.map((x) => x.x)
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

    labels.sort(function (a, b) {
      return a.datasetIndex - b.datasetIndex;
    });
  };

  /**
   * Enables or disables plot auto refreshing.
   **/
  async function autoUpdateHandler(e) {
    control.toggleAutoUpdate();
  }

  /** ***** Dragging and zoom functions *******/

  /**
   * Adjusts the global variables to perform a zoom in the chart.
   **/
  const zoomClickHandler = function (event) {
    if (!control.isAutoUpdateEnabled()) {
      if (control.zoomFlags().isZooming) {
        control.disableZoom();
      } else {
        control.enableZoom();
      }
    }
  };

  async function undoHandler() {
    if (control.undoStack().length > 0 && !control.isAutoUpdateEnabled()) {
      const undo = control.undoStack().pop();

      switch (undo.action) {
        case StackAction.REMOVE_PV:
          control.redoStack().push({ action: StackAction.REMOVE_PV, pv: undo.pv });
          control.appendPV(undo.pv, undo.optimized, true);
          break;

        case StackAction.APPEND_PV: {
          const index = control.getPlotIndex(undo.pv);

          control.redoStack().push({
            action: StackAction.APPEND_PV,
            pv: undo.pv,
            optimized: control.chart().data.datasets[index].pv.optimized,
          });
          control.removeDataset(index, true);
          break;
        }

        case StackAction.CHANGE_WINDOW_TIME: {
          control.redoStack().push({
            action: StackAction.CHANGE_WINDOW_TIME,
            window: control.windowTime(),
          });
          control.updateTimeWindow(undo.window);
          break;
        }

        case StackAction.CHANGE_END_TIME: {
          control.redoStack().push({
            action: StackAction.CHANGE_END_TIME,
            endTime: control.end(),
          });

          control.updateTimeReference(control.references.END);

          await control.updateStartAndEnd(undo.endTime, true);

          // does not change the time window, only updates all plots
          control.updateTimeWindow(control.windowTime());

          break;
        }

        case StackAction.CHANGE_START_TIME: {
          control.redoStack().push({
            action: StackAction.CHANGE_START_TIME,
            startTime: control.start(),
          });

          control.updateTimeReference(control.references.START);

          await control.updateStartAndEnd(undo.startTime, true);

          // does not change the time window, only updates all plots
          control.updateTimeWindow(control.windowTime());

          break;
        }

        case StackAction.ZOOM:
          control.redoStack().push({
            action: StackAction.ZOOM,
            startTime: control.start(),
            endTime: control.end(),
            windowTime: control.windowTime(),
          });

          await control.updateStartAndEnd(undo.endTime, true);

          control.updateTimeWindow(undo.windowTime);

          control.chart().update(0, false);

          break;
      }

      control.chart().update(0, false);
    }
  }

  async function redoHandler() {
    if (control.redoStack().length > 0 && !control.isAutoUpdateEnabled()) {
      const redo = control.redoStack().pop();

      switch (redo.action) {
        case StackAction.REMOVE_PV:
          control.removeDataset(control.getPlotIndex(redo.pv));
          break;

        case StackAction.APPEND_PV:
          control.appendPV(redo.pv, redo.optimized);
          break;

        case StackAction.CHANGE_WINDOW_TIME:
          control.updateTimeWindow(redo.window);
          break;

        case StackAction.CHANGE_START_TIME:
          control.enableLoading();

          control.updateTimeReference(control.references.START);

          await control.updateStartAndEnd(redo.startTime);
          control.updateAllPlots(true);
          control.updateURL();

          chartUtils.updateTimeAxis(
            control.chart(),
            chartUtils.timeAxisPreferences[control.windowTime()].unit,
            chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
            control.start(),
            control.end()
          );

          control.chart().update(0, false);

          control.disableLoading();

          break;

        case StackAction.CHANGE_END_TIME:
          control.enableLoading();

          control.updateTimeReference(control.references.END);

          await control.updateStartAndEnd(redo.endTime, true);
          control.updateAllPlots(true);
          control.updateURL();

          chartUtils.updateTimeAxis(
            control.chart(),
            chartUtils.timeAxisPreferences[control.windowTime()].unit,
            chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
            control.start(),
            control.end()
          );

          control.chart().update(0, false);

          control.disableLoading();

          break;

        case StackAction.ZOOM:
          // Updates the chart attributes
          control.updateStartTime(redo.startTime);
          control.updateEndTime(redo.endTime);

          chartUtils.updateTimeAxis(
            control.chart(),
            chartUtils.timeAxisPreferences[redo.windowTime].unit,
            chartUtils.timeAxisPreferences[redo.windowTime].unitStepSize,
            control.start(),
            control.end()
          );

          control.optimizeAllGraphs();
          control.updateAllPlots(true);
          control.updateURL();

          // Redraws the chart
          control.chart().update(0, false);

          control.updateOptimizedWarning();

          break;
      }

      control.chart().update(0, false);
    }
  }

  const updateReferenceTime = function (isEndSelected) {
    if (isEndSelected) {
      control.updateTimeReference(control.references.END);
    } else {
      control.updateTimeReference(control.references.START);
    }
  };

  return {
    bodyCallback: bodyCallback,
    tooltipColorHandler: tooltipColorHandler,

    onChangeDateHandler: onChangeDateHandler,
    updateTimeWindow: updateTimeWindow,
    updateEndNow: updateEndNow,
    backTimeWindow: backTimeWindow,
    forwTimeWindow: forwTimeWindow,
    queryPVsRetrieval: queryPVsRetrieval,
    plotSelectedPVs: plotSelectedPVs,
    scrollChart: scrollChart,
    autoUpdateHandler: autoUpdateHandler,
    singleTipHandler: singleTipHandler,

    zoomClickHandler: zoomClickHandler,

    exportAs: exportAs,
    undoHandler: undoHandler,
    redoHandler: redoHandler,
    updateReferenceTime: updateReferenceTime,
  };
})();
export default handlers;
