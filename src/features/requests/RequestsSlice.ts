import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialState } from "./RequestsState";

interface SetError {
  msg: string;
  date: Date;
}

export const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    increment: (state) => {
      state.pending++;
    },
    decrement: (state) => {
      state.pending--;
    },
    setError: {
      prepare(actionPrepare: SetError) {
        const { msg, date } = actionPrepare;
        return { payload: { msg, date: date.toString() } };
      },
      reducer(state, action: PayloadAction<{ msg: string; date: string }>) {
        state.error = action.payload.msg;
        state.errorDateString = action.payload.date;
      },
    },
  },
});

export const { decrement, increment, setError } = requestsSlice.actions;
export const { actions, reducer } = requestsSlice;
