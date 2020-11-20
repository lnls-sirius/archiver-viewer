import { createSlice } from "@reduxjs/toolkit";
import { TIME_IDS } from "../../lib/timeAxisPreferences";

const chartSlice = createSlice({
  name: "chart",
  initialState: {
    actionsStack: [],
    autoScroll: false,
    dataAxis: [],
    datasets: [],
    loading: false,
    singleTooltip: true,
    timeEnd: null,
    timeReferenceEnd: true,
    timeStart: null,
    windowTime: TIME_IDS.MIN_30,
    zooming: false,
  },
  reducers: {
    addToDataAxis: {
      reducer(state, action) {
        state.dataAxis.push(action.payload);
      },
      prepare(data) {
        return {
          payload: {
            yLimitManual: false,
            yMin: null,
            yMax: null,
            ...data,
            isLog: data.type === "linear" ? false : true,
          },
        };
      },
    },
    setAxisYLimitMin(state, action) {
      const { id, yMin } = action.payload;
      state.dataAxis.forEach((e) => {
        if (e.id === id) {
          e.yMin = yMin;
        }
      });
    },
    setAxisYLimitMax(state, action) {
      const { id, yMax } = action.payload;
      state.dataAxis.forEach((e) => {
        if (e.id === id) {
          e.yMax = yMax;
        }
      });
    },
    setAxisYLimitManual(state, action) {
      const { id, yLimitManual } = action.payload;
      state.dataAxis.forEach((e) => {
        if (e.id === id) {
          e.yLimitManual = yLimitManual;
        }
      });
    },
    setAxisTypeLog(state, action) {
      const { id, isLog } = action.payload;
      state.dataAxis.forEach((e) => {
        if (e.id === id) {
          e.isLog = isLog;
          e.type = isLog ? "logarithmic" : "linear";
        }
      });
    },
    //removeAxis(state, action) {},
    addToDataset(state, action) {
      state.datasets.push(action.payload);
    },
    setDatasetVisible(state, action) {
      const { index, visible } = action.payload;
      state.datasets[index].visible = visible;
    },
    setDatasetOptimized(state, action) {
      const { index, optimized } = action.payload;
      state.datasets[index].pv.optimized = optimized;
    },
    removeDataset(state, action) {
      state.datasets.splice(action.payload, 1);
    },
    /** @todo: Remove from dataset (by pvName?)*/
    addActionToStack(state, action) {
      state.actionsStack.push(action.payload);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setWindowTime(state, action) {
      state.windowTime = action.payload;
    },
    setAutoScroll(state, action) {
      state.autoScroll = action.payload;
    },
    setZooming(state, action) {
      state.zooming = action.payload;
    },
    setSingleTooltip(state, action) {
      state.singleTooltip = action.payload;
    },
    setTimeReferenceEnd(state, action) {
      state.timeReferenceEnd = action.payload;
    },
    setTimeStart(state, action) {
      state.timeStart = action.payload;
    },
    setTimeEnd(state, action) {
      state.timeEnd = action.payload;
    },
    /*popActionFromStack(state, action) {
      state.actionsStack.pop();
    },*/
  },
});

export const {
  /*popActionFromStack,*/
  addActionToStack,
  addToDataAxis,
  addToDataset,
  removeDataset,
  setAutoScroll,
  setAxisTypeLog,
  setAxisYLimitManual,
  setAxisYLimitMax,
  setAxisYLimitMin,
  setDatasetOptimized,
  setDatasetVisible,
  setLoading,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setTimeStart,
  setWindowTime,
  setZooming,
} = chartSlice.actions;

export default chartSlice.reducer;
