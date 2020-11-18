import { createSlice } from "@reduxjs/toolkit";
import { TIME_IDS } from "../../lib/timeAxisPreferences";

const chartSlice = createSlice({
  name: "chart",
  initialState: {
    actionsStack: [],
    autoScroll: false,
    singleTooltip: true,
    timeEnd: null,
    timeReferenceEnd: true,
    timeStart: null,
    windowTime: TIME_IDS.MIN_30,
    zooming: false,
  },
  reducers: {
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
    addActionToStack(state, action) {
      state.actionsStack.push(action.payload);
    },
    /*popActionFromStack(state, action) {
      state.actionsStack.pop();
    },*/
  },
});

export const {
  setAutoScroll,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setTimeStart,
  setWindowTime,
  setZooming,
  addActionToStack,
  /*popActionFromStack,*/
} = chartSlice.actions;

export default chartSlice.reducer;
