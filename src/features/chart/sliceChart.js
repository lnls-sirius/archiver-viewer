import { createSlice } from "@reduxjs/toolkit";
import { TIME_IDS } from "../../lib/timeAxisPreferences";

const chartSlice = createSlice({
  name: "chart",
  initialState: {
    windowTime: TIME_IDS.MIN_30,
    autoScroll: false,
    zooming: false,
    singleTooltip: false,
    timeReferenceEnd: true,
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
  },
});

export const { setWindowTime, setAutoScroll, setZooming, setSingleTooltip, setTimeReferenceEnd } = chartSlice.actions;

export default chartSlice.reducer;
