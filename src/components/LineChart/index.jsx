import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Chart } from "chart.js";

import * as S from "./styled";

import { setWindowTime } from "../../features/chart/sliceChart";
import { options } from "./contents";
import chartUtils from "../../lib/chartUtils";
import control from "../../lib/control";
import handlers from "../../lib/handlers";
import ui from "../../lib/ui";

const mapDispatch = { setWindowTime };

const mapStateToProps = (state) => {
  const { autoScroll, zooming, singleTooltip, timeReferenceEnd } = state.chart;

  return {
    autoScroll: autoScroll,
    isZooming: zooming,
    singleTooltip: singleTooltip,
    timeReferenceEnd: timeReferenceEnd,
  };
};

class LineChart extends Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
    this.state = {
      isDragging: false,
      zoomBoxVisible: false,
      zoomBeginX: 0,
      zoomBeginY: 0,
      zoomBoxHeight: 0,
      zoomBoxWidth: 0,
      zoomBoxLeft: 0,
      zoomBoxTop: 0,
      zoomTime1: null,
      zoomTime2: null,
      dragOffsetX: 0,
      dragEndTime: null,
    };
  }

  componentDidMount() {
    this.myChart = new Chart(this.chartRef.current, { type: "line", data: [], options });
    control.init(this.myChart);

    ui.hideWarning(); //@todo: Remove
    ui.hideSearchWarning(); //@todo: Remove
    control.loadFromURL(window.location.search);
  }

  handleScrollChart = (e) => {
    handlers.scrollChart(e);
  };

  startDragging = (e) => {
    const evt = e.nativeEvent;
    control.updateDragEndTime(control.end());

    this.setState(
      {
        isDragging: true,
        dragOffsetX: evt.offsetX,
        dragEndTime: control.end(),
      },
      () => {
        const { isZooming } = this.props;
        if (isZooming) {
          this.setState({
            zoomBoxVisible: true,
            zoomBeginX: 0,
            zoomBeginY: 0,
            zoomBoxHeight: 0,
            zoomBoxWidth: 0,
            zoomBoxLeft: 0,
            zoomBoxTop: 0,
            zoomTime2: null,
            zoomBeginX: evt.clientX,
            zoomBeginY: evt.clientY,
            zoomTime1: new Date(
              control.start().getTime() +
                (evt.offsetX * chartUtils.timeAxisPreferences[control.windowTime()].milliseconds) /
                  control.chart().chart.width
            ),
          });
        }
      }
    );
  };

  handleDoDragZoom = (e) => {
    // Draws zoom rectangle indicating the area in which this operation will applied
    const evt = e.nativeEvent;
    const { zoomBeginX } = this.state;

    const x = Math.min(zoomBeginX, evt.clientX);
    const w = Math.abs(zoomBeginX - evt.clientX);

    // console.log(this.chartRef.current.getBoundingClientRect());
    const { top, height } = this.chartRef.current.getBoundingClientRect();
    this.setState({
      zoomBoxLeft: x,
      zoomBoxTop: top,
      zoomBoxWidth: w,
      zoomBoxHeight: height,
    });
  };

  handleDoDataDrag = async (e) => {
    const evt = e.nativeEvent;
    const { dragOffsetX } = this.state;
    const offsetX = dragOffsetX - evt.offsetX;
    let newDate = new Date(
      control.end().getTime() +
        (offsetX * chartUtils.timeAxisPreferences[control.windowTime()].milliseconds) / control.chart().chart.width
    );

    if (control.reference() === control.references.START) {
      newDate = new Date(
        control.start().getTime() +
          (offsetX * chartUtils.timeAxisPreferences[control.windowTime()].milliseconds) / control.chart().chart.width
      );
    }
    this.setState({ dragOffsetX: evt.offsetX });

    await control.updateStartAndEnd(newDate, true, true);

    chartUtils.updateTimeAxis(
      control.chart(),
      chartUtils.timeAxisPreferences[control.windowTime()].unit,
      chartUtils.timeAxisPreferences[control.windowTime()].unitStepSize,
      control.start(),
      control.end()
    );

    control.chart().update(0, false);
  };

  /**
   * Handles a dragging event in the chart and updates the chart drawing area.
   **/
  doDragging = async (e) => {
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
      return;
    }
  };

  handleStopDragData = async () => {
    const { dragEndTime } = this.state;

    control.updateAllPlots(true);
    control.updateURL();
    control.chart().update(0, false);

    control.undoStack().push({
      action: control.stackActions.CHANGE_END_TIME,
      endTime: dragEndTime,
    });
  };

  handleStopDragZoom = async (evt) => {
    const zoomTime2 = new Date(
      control.start().getTime() +
        (evt.offsetX * chartUtils.timeAxisPreferences[control.windowTime()].milliseconds) / control.chart().chart.width
    );
    this.setState({ zoomTime2: zoomTime2 }, () => {
      const { zoomTime1, zoomTime2 } = this.state;
      control.undoStack().push({
        action: control.stackActions.ZOOM,
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
  stopDragging = async (e) => {
    const { isZooming } = this.props;
    const { isDragging } = this.state;

    const evt = e.nativeEvent;

    if (isDragging && !isZooming) {
      this.handleStopDragData(e);
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
          ref={this.chartRef}
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
LineChart.propTypes = {
  setWindowTime: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatch)(LineChart);
