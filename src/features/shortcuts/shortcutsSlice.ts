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
      if(action.payload != state.stKey &&
          action.payload != state.ndKey &&
          action.payload != state.rdKey){
        state.rdKey = state.ndKey;
        state.ndKey = state.stKey;
        state.stKey = action.payload;
        console.log(state.stKey + "-" + state.ndKey + "-" + state.rdKey)
      }
    },
    unsetKey(state, action: PayloadAction<string>) {
      if(action.payload == state.rdKey) {
        state.rdKey = "";
      }else if(action.payload == state.ndKey) {
        state.ndKey = state.rdKey;
        state.rdKey = "";
      }else if(action.payload == state.stKey) {
        state.stKey = state.ndKey;
        state.ndKey = state.rdKey;
        state.rdKey = "";
      }
      console.log(state.stKey + "-" + state.ndKey + "-" + state.rdKey)
    },
    setInfoResultsVisible: (state, action: PayloadAction<boolean>) => {
      state.info = action.payload;
    }
  }
});

export const { actions, reducer } = shortcutsSlice;
