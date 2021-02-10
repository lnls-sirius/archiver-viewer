import { configureStore } from "@reduxjs/toolkit";
import logger from "redux-logger";
import rootReducer from "./reducers";

const isLocalhost = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

const middleware = isLocalhost
  ? (getDefaultMiddleware: any) => getDefaultMiddleware().concat(logger)
  : (getDefaultMiddleware: any) => getDefaultMiddleware();

const store = configureStore({
  reducer: rootReducer,
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  middleware, // : (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

export default store;
