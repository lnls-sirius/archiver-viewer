import React, { Component } from "react";
import { connect } from "react-redux";
import { Chart } from "chart.js";

import * as S from "./styled";

import chartUtils from "../../utility/chartUtils";
import handlers from "../../lib/handlers";
import control from "../../controllers";
import { StackAction } from "../../controllers/ActionsStack/ActionsStackConstants";

import { options } from "./config";
import { initialState, getAverageDateFromEvent, LineChartProps, LineChartStates } from "./contents";
import { RootState } from "../../reducers";

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
  }

  handleScrollChart = (e: React.WheelEvent<HTMLCanvasElement>) => {
    handlers.scrollChart(e);
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
    control.updateDragEndTime(control.end());

    this.setState(
      {
        isDragging: true,
        dragOffsetX: evt.offsetX,
        dragEndTime: control.end(),
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
    let newDate = new Date(
      control.end().getTime() +
        (offsetX * chartUtils.timeAxisPreferences[control.windowTime()].milliseconds) / this.chart.width
    );

    if (control.reference() === control.references.START) {
      newDate = new Date(
        control.start().getTime() +
          (offsetX * chartUtils.timeAxisPreferences[control.windowTime()].milliseconds) / this.chart.width
      );
    }
    this.setState({ dragOffsetX: evt.offsetX });

    await control.updateStartAndEnd(newDate);

    chartUtils.updateTimeAxis(
      this.chart,
      chartUtils.timeAxisPreferences[control.windowTime()].unit,
      chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
      control.start(),
      control.end()
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

    control.undoStack().push({
      action: StackAction.CHANGE_END_TIME,
      endTime: dragEndTime,
    });
  };

  handleStopDragZoom = async (evt: MouseEvent) => {
    const zoomTime2 = getAverageDateFromEvent(this.chart, evt);
    this.setState({ zoomTime2: zoomTime2 }, () => {
      const { zoomTime1, zoomTime2 } = this.state;
      if (!zoomTime1 || !zoomTime2) {
        console.warn(`Invalid time range  ${zoomTime1} ${zoomTime2}`);
        return;
      }
      control.undoStack().push({
        action: StackAction.ZOOM,
        startTime: control.start(),
        endTime: control.end(),
        windowTime: control.windowTime(),
      });

      // Checks which zoom times should be used as start time or end time
      if (zoomTime1 < zoomTime2) {
        control.updateStartTime(zoomTime1);
        control.updateEndTime(zoomTime2);
      } else {
        control.updateStartTime(zoomTime2);
        control.updateEndTime(zoomTime1);
      }

      // Chooses the x axis time scale
      let i = 0;
      while (
        control.end().getTime() - control.start().getTime() < chartUtils.timeAxisPreferences[i].milliseconds &&
        i < chartUtils.timeIDs.SEG_30
      ) {
        i++;
      }

      control.updateTimeWindow(i);

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
