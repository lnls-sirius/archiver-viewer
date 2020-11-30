import { createSlice } from "@reduxjs/toolkit";
import { TIME_IDS } from "../../lib/timeAxisPreferences";

const chartSlice = createSlice({
  name: "chart",
  initialState: {
    actionsStack: [],
    autoScroll: false,
    searchResults: {},
    isSearchResultsVisible: false,
    dataAxis: [], // @todo: Transform into an object
    datasets: [], // @todo: Transform into an object
    loading: false,
    singleTooltip: true,
    timeEnd: null,
    timeReferenceEnd: true,
    timeStart: null,
    windowTime: TIME_IDS.MIN_30,
    zooming: false,
  },
  reducers: {
    setSearchResultsVisible(state, action) {
      state.isSearchResultsVisible = action.payload;
    },
    setSearchResults: {
      reducer(state, action) {
        state.searchResults = action.payload;
      },
      prepare(data) {
        const map = {};
        data.forEach((e) => {
          // @todo: Check if the pvName is already plotted
          e.isSelected = false;
          map[e.pvName] = e;
        });
        return {
          payload: map,
        };
      },
    },
    doSelectAllResults(state, action) {
      for (const e in state.searchResults) {
        state.searchResults[e].isSelected = true;
      }
    },
    doDeselectAllResults(state, action) {
      for (const e in state.searchResults) {
        state.searchResults[e].isSelected = false;
      }
    },
    doSelectMultipleResults(state, action) {
      action.payload.data.forEach(({ isSelected, pvName }) => {
        state.searchResults[pvName].isSelected = isSelected;
      });
    },
    doSelectSearchResult(state, action) {
      const { isSelected, pvName } = action.payload;
      state.searchResults[pvName].isSelected = isSelected;
    },
    doRemoveDataAxis(state, action) {
      let index = null;
      state.dataAxis.forEach((e, idx) => {
        if (e.id === action.payload) index = idx;
      });
      if (index !== null) {
        state.dataAxis.splice(index, 1);
      }
    },
    addToDataAxis: {
      reducer(state, action) {
        state.dataAxis.push(action.payload);
      },
      prepare(data) {
        return {
          payload: {
            ...data,
            isLog: data.type === "linear" ? false : true,
            yLimitManual: false,
            yMax: null,
            yMin: null,
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
    addToDataset: {
      reducer(state, action) {
        state.datasets.push(action.payload);
      },
      prepare(data) {
        return {
          payload: {
            fetching: false,
            fetchTime: null,
            ...data,
          },
        };
      },
    },
    clearDatasetFetching(state, action) {
      const { idx } = action.payload;
      if (index > state.datasets.length) {
        console.warn(`Invalid dataset index ${idx}`);
        return;
      }
      state.datasets[idx].fetching = false;
      state.datasets[idx].fetchTime = null;
    },
    setDatasetFetching(state, action) {
      const { idx, time } = action.payload;
      if (index > state.datasets.length) {
        console.warn(`Invalid dataset index ${idx}`);
        return;
      }
      state.datasets[idx].fetching = true;
      state.datasets[idx].fetchTime = time.getTime();
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
      const { idx, removeAxis } = action.payload;
      state.datasets.splice(idx, 1);

      if (removeAxis !== null) {
        // Remove data axis if needed
        let index = null;
        state.dataAxis.forEach((e, idx) => {
          if (e.id === removeAxis) index = idx;
        });
        if (index !== null) {
          state.dataAxis.splice(index, 1);
        }
      }
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
  clearDatasetFetching,
  doRemoveDataAxis,
  doDeselectAllResults,
  doSelectAllResults,
  doSelectMultipleResults,
  doSelectSearchResult,
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
  setSearchResults,
  setSearchResultsVisible,
  setSingleTooltip,
  setTimeEnd,
  setTimeReferenceEnd,
  setTimeStart,
  setWindowTime,
  setZooming,
} = chartSlice.actions;

export default chartSlice.reducer;
