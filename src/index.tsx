/* eslint-disable radix */
import React from "react";
import ReactDOM from "react-dom";

import "chart.js";

import "./css/reset.css";
import "./css/archiver.css";

import App from "./components/App";

import { Provider } from "react-redux";
import store from "./store";
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
