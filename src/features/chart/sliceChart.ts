import { createSlice } from "@reduxjs/toolkit";
import initialState from "./initialState";
import * as reducers from "./reducers";

const chartSlice = createSlice({
  name: "chart",
  initialState,
  reducers,
});

export const {
  addToDataAxis,
  addToDataset,
  doRemoveDataAxis,
  removeDataset,
  setAutoScroll,
  setAxisTypeLog,
  setAxisYLimitManual,
  setAxisYLimitMax,
  setAxisYLimitMin,
  setDatasetOptimized,
  setDatasetDrift,
  setDatasetVisible,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setSelectedTime,
  setTimeStart,
  setWindowTime,
  setZooming
} = chartSlice.actions;

export const actions = chartSlice.actions;
export default chartSlice.reducer;
