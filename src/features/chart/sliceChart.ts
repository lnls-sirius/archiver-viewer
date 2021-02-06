import { createSlice } from "@reduxjs/toolkit";
import initialState from "./initialState";
import * as reducers from "./reducers";

const chartSlice = createSlice({
  name: "chart",
  initialState,
  reducers,
});

export const {
  addActionToStack,
  addToDataAxis,
  addToDataset,
  clearDatasetFetching,
  doRemoveDataAxis,
  removeDataset,
  setAutoScroll,
  setAxisTypeLog,
  setAxisYLimitManual,
  setAxisYLimitMax,
  setAxisYLimitMin,
  setDatasetFetching,
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

export const actions = chartSlice.actions;
export default chartSlice.reducer;
