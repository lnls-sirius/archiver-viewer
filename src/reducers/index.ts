import { combineReducers } from "redux";
import chartReducer from "../features/chart/sliceChart";
import { reducer as requestsReducer } from "../features/requests";
import { reducer as searchReducer } from "../features/search";
import { reducer as statusReducer } from "../features/status";
import { reducer as shortcutsReducer } from "../features/shortcuts";

const rootReducer = combineReducers({
  chart: chartReducer,
  requests: requestsReducer,
  search: searchReducer,
  status: statusReducer,
  shortcuts: shortcutsReducer
});
export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
