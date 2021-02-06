import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialState, SearchResult } from "./SearchState";

export interface SelectSearchResultAction {
  selected: boolean;
  pvName: string;
}

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchResults: {
      reducer(state, action: PayloadAction<{ [key: string]: SearchResult }>) {
        state.results = action.payload;
      },
      prepare(data: any[]) {
        const map: { [key: string]: SearchResult } = {};
        data.forEach((e) => {
          // @todo: Check if the pvName is already plotted
          const selected = false;
          const result: SearchResult = {
            ...e,
            selected,
          };
          map[e.pvName] = result;
        });
        return {
          payload: map,
        };
      },
    },
    setSearchResultsVisible: (state, action: PayloadAction<boolean>) => {
      state.visible = action.payload;
    },
    doSelectAllResults(state) {
      for (const key in state.results) {
        state.results[key].selected = true;
      }
    },
    doDeselectAllResults(state) {
      for (const key in state.results) {
        state.results[key].selected = false;
      }
    },
    doSelectSearchResult(state, action: PayloadAction<SelectSearchResultAction>) {
      const { selected, pvName } = action.payload;
      const result = state.results[pvName];
      result.selected = selected;
    },
  },
});

export const { actions, reducer } = searchSlice;
