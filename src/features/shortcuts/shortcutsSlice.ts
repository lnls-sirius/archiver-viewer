import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Keys {
  stKey: string,
  ndKey: string,
  rdKey: string
}

const initialState: Keys = {
  stKey: null,
  ndKey: null,
  rdKey: null
};

const shortcutsSlice = createSlice({
  initialState,
  name: "shortcuts",
  reducers: {
    setKeys(state, action: PayloadAction<string>) {
      state.rdKey = state.ndKey;
      state.ndKey = state.stKey;
      state.stKey = action.payload;
    }
  }
});

export const { actions, reducer } = shortcutsSlice;
