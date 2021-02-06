import { combineReducers } from "redux";
import chartReducer from "../features/chart/sliceChart";
import { reducer as requestsSlice } from "../features/requests";
import { reducer as searchSlice } from "../features/search";

const rootReducer = combineReducers({
  chart: chartReducer,
  requests: requestsSlice,
  search: searchSlice,
});
export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
