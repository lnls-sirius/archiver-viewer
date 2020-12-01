import { combineReducers } from "redux";
import chartReducer from "../features/chart/sliceChart";

export default combineReducers({
  chart: chartReducer,
});
