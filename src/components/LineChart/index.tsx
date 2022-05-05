import React, { Component, KeyboardEventHandler } from "react";
import { connect } from "react-redux";
import { Chart } from "chart.js";

import UrlLoader from "../../controllers/UrlLoader";
import chartUtils from "../../utility/chartUtils";
import { RootState } from "../../reducers";
import { StackActionEnum } from "../../entities/Chart/StackAction/constants";
import { REFERENCE } from "../../entities/Chart";
import control from "../../entities/Chart";
import * as S from "./styled";
import { options } from "./config";
import { initialState, getAverageDateFromEvent, LineChartProps, LineChartStates } from "./contents";
import handlers from "../../controllers/handlers";

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
  private lastKeyCtrl: boolean;
  private chartDOMRef: React.RefObject<HTMLCanvasElement>;
  private updateProps: Chart.ChartUpdateProps;

  constructor(props: LineChartProps | Readonly<LineChartProps>) {
    super(props);
    this.chartDOMRef = React.createRef();
    this.state = initialState;
    this.chart = null;
    this.lastKeyCtrl = false;
    this.updateProps = { duration: 0, easing: "linear", lazy: false };
  }

  componentDidMount() {
    this.chart = new Chart(this.chartDOMRef.current, { type: "line", options });
    control.init(this.chart);
    UrlLoader.load();
  }

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
        zoomTime2: null
      });
    }
  };

  startDragging = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const evt = e.nativeEvent;
    this.setState(
      {
        isDragging: true,
        dragOffsetX: evt.offsetX,
        dragStartTime: control.getStart(),
        dragEndTime: control.getEnd()
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
      zoomBoxHeight: height
    });
  };

  handleDoDataDrag = async (e: React.MouseEvent) => {
    const evt = e.nativeEvent;
    const { dragOffsetX, dragEndTime, dragStartTime } = this.state;
    const offsetX = dragOffsetX - evt.offsetX;
    const windowTime = control.getWindowTime();

    const ms = chartUtils.timeAxisPreferences[windowTime].milliseconds;

    const endTimeMs = dragEndTime.getTime();
    const startTimeMs = dragStartTime.getTime();

    const newDragEndTime = new Date(endTimeMs + (offsetX * ms) / this.chart.width);
    const newDragStartTime = new Date(startTimeMs + (offsetX * ms) / this.chart.width);
    this.setState({ dragOffsetX: evt.offsetX, dragEndTime: newDragEndTime, dragStartTime: newDragStartTime });

    this.updateChartTimeAxis(newDragStartTime, newDragEndTime);
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
    const { dragEndTime, dragStartTime } = this.state;

    let newDate = control.getReference() === REFERENCE.START ? dragStartTime : dragEndTime;
    const now = new Date();
    if (newDate > now) {
      newDate = now;
    }

    // Update time axis in order to sync with the new range and enforce min/max
    this.updateChartTimeAxis(dragStartTime, dragEndTime > now ? now : dragEndTime);

    await control.updateStartAndEnd(newDate);
    await control.updateAllPlots(false, true).then(() => {
      control.updateURL();

      control.undoStackPush({
        action: StackActionEnum.CHANGE_END_TIME,
        endTime: newDate,
      });
    });
  };

  private updateChartTimeAxis(newDragStartTime: Date, newDragEndTime: Date) {
    control.updateTimeAxis(newDragStartTime, newDragEndTime);
    this.chart.update(this.updateProps);
  }

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
        action: StackActionEnum.ZOOM,
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

      control.referenceOutOfRange();

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

  saveLastKey = async (e: React.KeyboardEvent) => {
    this.lastKeyCtrl = e.ctrlKey;
  }

  dropLastKey = async () => {
    this.lastKeyCtrl = false;
  }

  focusChart = async () => {
    this.chartDOMRef.current.focus();
  }


  getTimePoint = async () => {
    if(this.lastKeyCtrl == true){
      const {dragOffsetX} = this.state;

      let windowTime = control.getWindowTime();
      let ms = chartUtils.timeAxisPreferences[windowTime].milliseconds;

      let newArea = this.chart.width/(this.chart.chartArea.right - this.chart.chartArea.left);
      let offsetX = (dragOffsetX - this.chart.chartArea.left)*newArea;

      let timePoint = new Date(control.getStart().getTime() + (offsetX*ms/ this.chart.width));

      handlers.onChangeSelectedTime(timePoint);
    }
  }

  render() {
    const { zoomBoxVisible, zoomBoxHeight, zoomBoxWidth, zoomBoxLeft, zoomBoxTop } = this.state;
    return (
      <S.LineChartWrapper
          onKeyDown={this.saveLastKey}
          onKeyUp={this.dropLastKey}
      >
          <canvas
            ref={this.chartDOMRef}
            onMouseDown={this.startDragging}
            onMouseMove={this.doDragging}
            onMouseUp={this.stopDragging}
            onMouseOver={this.focusChart}
            onClick={this.getTimePoint}
            tabIndex={0}
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
