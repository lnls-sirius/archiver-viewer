import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Keys {
  stKey: string,
  ndKey: string,
  rdKey: string,
  info: boolean
}

const initialState: Keys = {
  stKey: null,
  ndKey: null,
  rdKey: null,
  info: false
};

const shortcutsSlice = createSlice({
  initialState,
  name: "shortcuts",
  reducers: {
    setKeys(state, action: PayloadAction<string>) {
      if(action.payload != state.stKey){
        state.rdKey = state.ndKey;
        state.ndKey = state.stKey;
        state.stKey = action.payload;
      }
    },
    setInfoResultsVisible: (state, action: PayloadAction<boolean>) => {
      state.info = action.payload;
    }
  }
});

export const { actions, reducer } = shortcutsSlice;
