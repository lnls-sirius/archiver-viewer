import React, { Component } from "react";
import { connect } from "react-redux";
import { Chart } from "chart.js";

import UrlLoader from "../../controllers/UrlLoader";
import chartUtils from "../../utility/chartUtils";
import { RootState } from "../../reducers";
import { StackActionEnum } from "../../entities/Chart/StackAction/constants";
import { REFERENCE } from "../../entities/Chart";
import control from "../../entities/Chart";
import { options } from "./config";
import { initialState, getAverageDateFromEvent, LineChartProps, LineChartStates } from "./contents";
import handlers from "../../controllers/handlers";
import * as S from "./styled";

const mapStateToProps = (state: RootState) => {
  const { autoScroll, zooming, singleTooltip } = state.chart;
  const {stKey, ndKey, rdKey} = state.shortcuts;
  return {
    autoScroll: autoScroll,
    isZooming: zooming,
    singleTooltip: singleTooltip,
    stKey: stKey,
    ndKey: ndKey,
    rdKey: rdKey
  };
};

class ChartMod extends Chart{
  getElementsAtXAxis: (e: any) => Array<{}>;
}

class LineChart extends Component<LineChartProps, LineChartStates> {
  private chart: ChartMod;
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
    this.chart = new ChartMod(this.chartDOMRef.current, { type: "line", options });
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
    // const windowTime = control.getWindowTime();
    const ms = control.getIntervalTime();

    // const ms = chartUtils.timeAxisPreferences[windowTime].milliseconds;

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
        windowTime: control.getWindowTime()
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

  distanceAxisClick = (coordAxis: Array<number>, coordClick: Array<number>) => {
    return Math.sqrt(((coordAxis[0]-coordClick[0])**2) + ((coordAxis[1]-coordClick[1])**2))
  }

  getNearestXAxis = (evt: any) => {
    let activePoints: any = this.chart.getElementsAtXAxis(evt);
    let rect = document.getElementById("canvas").getBoundingClientRect();
    let coordAxis = [0, 0];
    let nearestDataset = 0;
    let nearestDist = rect.width * rect.height;
    let distDataset = 0;
    const coordClick = [evt.clientX - rect.left, evt.clientY - rect.top];
    activePoints.map((axis: any) => {
      coordAxis = [axis._model.x, axis._model.y];
      distDataset = this.distanceAxisClick(coordAxis, coordClick);
      if(nearestDist > distDataset){
        nearestDist = distDataset;
        nearestDataset = axis._datasetIndex;
      }
    })
    return nearestDataset;
  }

  removeAxis = (evt: any) => {
    const datasetIndex = this.getNearestXAxis(evt);
    control.removeDataset(datasetIndex);
  }

  setInvisible = (evt: any) => {
    const datasetIndex = this.getNearestXAxis(evt);
    control.hideDatasetByIndex(datasetIndex);
  }

  diffDataset = (datasetIndex: number) => {
    const dataset = control.getDatasets();
    const label = dataset[datasetIndex].metadata.label;
    control.diffPlot(
      label, !dataset[datasetIndex].metadata.pv.diff);
  }

  setSingleDiff = (evt: any) => {
    const datasetIndex = this.getNearestXAxis(evt);
    this.diffDataset(datasetIndex);
  }

  setAllDiff = (evt: any) => {
    const datasets = this.chart.getElementsAtXAxis(evt);
    datasets.map((dataset: any) => {
      this.diffDataset(dataset._datasetIndex);
    })
  }

  setOptimized = (evt: any) => {
    const datasetIndex = this.getNearestXAxis(evt);
    const dataset = control.getDatasets();
    const label = dataset[datasetIndex].metadata.label;
    control.optimizePlot(
      label, !dataset[datasetIndex].metadata.pv.optimized);
  }

  getTimePoint = async () =>{
    const {dragOffsetX} = this.state;
    let ms = control.getIntervalTime();

    let newArea = this.chart.width/(this.chart.chartArea.right - this.chart.chartArea.left);
    let offsetX = (dragOffsetX - this.chart.chartArea.left)*newArea;

    let timePoint = new Date(control.getStart().getTime() + (offsetX*ms/ this.chart.width));

    handlers.onChangeSelectedTime(timePoint);
  }

  handleCanvasClick = async (evt: any) => {
    const { stKey, ndKey, rdKey } = this.props;
    if(stKey == 'Control'){
      this.getTimePoint();
    }else if(ndKey == 'Shift' &&
              (stKey == 'r' || stKey == 'R')){
      this.removeAxis(evt);
    }else if(ndKey == 'Shift' &&
              (stKey == 'v' || stKey == 'V')){
      this.setInvisible(evt);
    }else if(rdKey == 'Shift' &&
              (ndKey == 'd' || ndKey == 'D') &&
              (stKey == 'a' || stKey == 'A')){
      this.setAllDiff(evt);
    }else if(ndKey == 'Shift' &&
              (stKey == 'd' || stKey == 'D')){
      this.setSingleDiff(evt);
    }else if(ndKey == 'Shift' &&
              (stKey == 'f' || stKey == 'F')){
      this.setOptimized(evt);
    }
  }

  render() {
    const { zoomBoxVisible, zoomBoxHeight, zoomBoxWidth, zoomBoxLeft, zoomBoxTop } = this.state;
    return (
      <S.LineChartWrapper>
          <canvas
            id="canvas"
            ref={this.chartDOMRef}
            onMouseDown={this.startDragging}
            onMouseMove={this.doDragging}
            onMouseUp={this.stopDragging}
            onClick={this.handleCanvasClick}
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
