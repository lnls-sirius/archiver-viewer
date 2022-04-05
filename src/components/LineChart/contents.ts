export interface LineChartStates {
  zoomBeginX: number;
  zoomBeginY: number;
  zoomBoxLeft: number;
  zoomBoxTop: number;
  zoomBoxWidth: number;
  zoomBoxHeight: number;
  dragOffsetX: number;
  zoomBoxVisible: boolean;
  zoomTime1: Date;
  zoomTime2: Date;
  dragEndTime: Date;
  dragStartTime: Date;
  isDragging: boolean;
}
export interface LineChartProps {
  isZooming: boolean;
  singleTooltip: boolean;
}

export const initialState: LineChartStates = {
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
  dragStartTime: null
};

export const getAverageDateFromEvent = (chart: Chart, evt: DragEvent | MouseEvent): Date => {
  let millis = 0;

  const elements = (chart as any).getElementsAtEventForMode(evt, "index", { intersect: false });
  elements.map((e: any) => {
    const dsetIdx = e._datasetIndex;
    const idx = e._index;
    const { x } = chart.data.datasets[dsetIdx].data[idx] as any;
    millis += x.getTime();
  });
  return millis > 0 ? new Date(millis / elements.length) : null;
};
