import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageLevel } from "../../utility/consts/MessageLevel";
export interface Entry {
  message: string;
  title: string;
  dateString: string;
  level: MessageLevel;
  id: number;
}
interface StatusState {
  entries: Entry[];
}
const initialState: StatusState = {
  entries: [],
};

export interface AddEntryPrepare {
  title: string;
  message: string;
  time: Date;
  level: MessageLevel;
}

const MAX_HISTORY_LENGTH = 10;
let entryIDCounter = 0;
const statusSlice = createSlice({
  initialState,
  name: "status",
  reducers: {
    addEntry: {
      reducer(state, action: PayloadAction<Entry>) {
        if (state.entries.length > MAX_HISTORY_LENGTH) {
          state.entries = state.entries.slice(1);
        } else {
          state.entries.push(action.payload);
        }
      },
      prepare({ level, message, time, title }: AddEntryPrepare) {
        entryIDCounter++;
        const entry: Entry = {
          dateString: time.toString(),
          level,
          message,
          title,
          id: entryIDCounter,
        };
        return { payload: entry };
      },
    },
  },
});

export const { actions, reducer } = statusSlice;
