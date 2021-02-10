import { createSlice } from "@reduxjs/toolkit";
export interface RequestsState {
  pending: number;
  error: string;
  errorDateString: string;
}

const initialState: RequestsState = {
  pending: 0,
  error: "",
  errorDateString: "",
};
export { initialState };

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
  },
});

export const { decrement, increment } = requestsSlice.actions;
export const { actions, reducer } = requestsSlice;
