import React, { Component } from "react";
import { connect } from "react-redux";
import { Chart } from "chart.js";

import * as S from "./styled";

import chartUtils from "../../utility/chartUtils";
import handlers from "../../controllers/handlers";
import control, { REFERENCE } from "../../controllers";
import { StackAction } from "../../controllers/ActionsStack/constants";

import { options } from "./config";
import { initialState, getAverageDateFromEvent, LineChartProps, LineChartStates } from "./contents";
import { RootState } from "../../reducers";
import UrlLoader from "../../controllers/UrlLoader";

const mapStateToProps = (state: RootState) => {
  const { autoScroll, zooming, singleTooltip } = state.chart;

  return {
    autoScroll: autoScroll,
    isZooming: zooming,
    singleTooltip: singleTooltip,
  };
};

class LineChart extends Component<LineChartProps, LineChartStates> {
  private chart: Chart;
  private chartDOMRef: React.RefObject<HTMLCanvasElement>;
  private updateProps: Chart.ChartUpdateProps;

  constructor(props: LineChartProps | Readonly<LineChartProps>) {
    super(props);
    this.chartDOMRef = React.createRef();
    this.state = initialState;
    this.chart = null;
    this.updateProps = { duration: 0, easing: "linear", lazy: false };
  }

  componentDidMount() {
    this.chart = new Chart(this.chartDOMRef.current, { type: "line", options });
    control.init(this.chart);
    UrlLoader.load();
  }

  handleScrollChart = (e: React.WheelEvent<HTMLCanvasElement>) => {
    handlers.scrollChart(e.deltaY);
  };

  setZoomBoxInitialState = (evt: MouseEvent) => {
    const { isZooming } = this.props;
    if (isZooming) {
      const zoomTime1 = getAverageDateFromEvent(this.chart, evt);
      this.setState({
        zoomBeginX: evt.clientX,
        zoomBeginY: evt.clientY,
        zoomBoxHeight: 0,
        zoomBoxLeft: 0,
        zoomBoxTop: 0,
        zoomBoxVisible: true,
        zoomBoxWidth: 0,
        zoomTime1,
        zoomTime2: null,
      });
    }
  };

  startDragging = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const evt = e.nativeEvent;
    control.updateDragEndTime(control.getEnd());

    this.setState(
      {
        isDragging: true,
        dragOffsetX: evt.offsetX,
        dragEndTime: control.getEnd(),
      },
      () => this.setZoomBoxInitialState(evt)
    );
  };

  handleDoDragZoom = (e: React.MouseEvent) => {
    // Draws zoom rectangle indicating the area in which this operation will applied
    const evt = e.nativeEvent;
    const { zoomBeginX } = this.state;

    const x = Math.min(zoomBeginX, evt.clientX);
    const w = Math.abs(zoomBeginX - evt.clientX);

    const { top, height } = this.chartDOMRef.current.getBoundingClientRect();
    this.setState({
      zoomBoxLeft: x,
      zoomBoxTop: top,
      zoomBoxWidth: w,
      zoomBoxHeight: height,
    });
  };

  handleDoDataDrag = async (e: React.MouseEvent) => {
    const evt = e.nativeEvent;
    const { dragOffsetX } = this.state;
    const offsetX = dragOffsetX - evt.offsetX;
    const windowTime = control.getWindowTime();

    const ms = chartUtils.timeAxisPreferences[windowTime].milliseconds;

    const endTime = control.getEnd();
    const startTime = control.getStart();

    const endTimeMs = endTime.getTime();
    const startTimeMs = startTime.getTime();

    let newDate = new Date(endTimeMs + (offsetX * ms) / this.chart.width);

    if (control.getReference() === REFERENCE.START) {
      newDate = new Date(startTimeMs + (offsetX * ms) / this.chart.width);
    }
    this.setState({ dragOffsetX: evt.offsetX });

    await control.updateStartAndEnd(newDate);

    chartUtils.updateTimeAxis(
      this.chart,
      chartUtils.timeAxisPreferences[windowTime].unit,
      chartUtils.timeAxisPreferences[windowTime].unitStepSize,
      startTime,
      endTime
    );

    this.chart.update(this.updateProps);
  };

  /**
   * Handles a dragging event in the chart and updates the chart drawing area.
   **/
  doDragging = async (e: React.MouseEvent) => {
    const { isZooming, autoScroll } = this.props;
    const { isDragging } = this.state;

    if (!isDragging) {
      return;
    }

    if (isZooming && !autoScroll) {
      this.handleDoDragZoom(e);
      return;
    }

    if (!isZooming && !autoScroll) {
      this.handleDoDataDrag(e);
    }
  };

  handleStopDragData = async () => {
    const { dragEndTime } = this.state;

    control.updateAllPlots(true);
    control.updateURL();
    this.chart.update(this.updateProps);

    control.undoStackPush({
      action: StackAction.CHANGE_END_TIME,
      endTime: dragEndTime,
    });
  };

  // Chooses the x axis time scale
  decreaseTimeWindowWhileTimeWindowIsLargerThanStartEndDelta(minWindowTime: number) {
    let i = 0;
    const startEndDeltaTimeMs = control.getEnd().getTime() - control.getStart().getTime();

    while (startEndDeltaTimeMs < chartUtils.timeAxisPreferences[i].milliseconds && i < minWindowTime) {
      i++;
    }
    control.updateTimeWindow(i);
  }

  handleStopDragZoom = async (evt: MouseEvent) => {
    const zoomTime2 = getAverageDateFromEvent(this.chart, evt);
    this.setState({ zoomTime2: zoomTime2 }, () => {
      const { zoomTime1, zoomTime2 } = this.state;
      if (!zoomTime1 || !zoomTime2) {
        console.warn(`Invalid time range  ${zoomTime1} ${zoomTime2}`);
        return;
      }
      control.undoStackPush({
        action: StackAction.ZOOM,
        startTime: control.getStart(),
        endTime: control.getEnd(),
        windowTime: control.getWindowTime(),
      });

      // Checks which zoom times should be used as start time or end time
      if (zoomTime1 < zoomTime2) {
        control.setStart(zoomTime1);
        control.setEnd(zoomTime2);
      } else {
        control.setStart(zoomTime2);
        control.setEnd(zoomTime1);
      }

      this.decreaseTimeWindowWhileTimeWindowIsLargerThanStartEndDelta(chartUtils.timeIDs.SEG_30);
      control.updateOptimizedWarning();
      control.disableZoom();
    });
  };

  /**
   * Finishes dragging and applies zoom on the chart if this action was previously selected.
   **/
  stopDragging = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { isZooming } = this.props;
    const { isDragging } = this.state;

    const evt = e.nativeEvent;

    if (isDragging && !isZooming) {
      this.handleStopDragData();
    }

    // Finishes zoom and updates the chart
    if (isZooming) {
      this.handleStopDragZoom(evt);
    }

    this.setState({
      isDragging: false,
      zoomBoxVisible: false,
    });
  };

  render() {
    const { zoomBoxVisible, zoomBoxHeight, zoomBoxWidth, zoomBoxLeft, zoomBoxTop } = this.state;
    return (
      <S.LineChartWrapper>
        <canvas
          ref={this.chartDOMRef}
          onWheel={this.handleScrollChart}
          onMouseDown={this.startDragging}
          onMouseMove={this.doDragging}
          onMouseUp={this.stopDragging}
        />
        <S.ZoomBox
          $height={zoomBoxHeight}
          $width={zoomBoxWidth}
          $top={zoomBoxTop}
          $left={zoomBoxLeft}
          $visible={zoomBoxVisible}
        />
      </S.LineChartWrapper>
    );
  }
}

export default connect(mapStateToProps)(LineChart);
