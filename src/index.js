/** *
  A web viewer application based on Chartjs for the EPICS archiver.

  Gustavo Ciotto Pinton
  LNLS - Brazilian Synchrotron Laboratory
***/

import React from "react";
import ReactDOM from "react-dom";

import "jquery-browserify";
import "chart.js";

import handlers from "./lib/handlers";
import ui from "./lib/ui";

import "./css/reset.css";
import "./css/archiver.css";

import App from "./components/App";

ReactDOM.render(<App />, document.getElementById("root"));

/* Registers event handler functions */
$("#plotSelected").on("click", handlers.plotSelectedPVs);
$("#selectAll").on("click", ui.selectedAllPVs);
$("#deselectAll").on("click", ui.deselectedAllPVs);
$("#close").on("click", ui.hideSearchedPVs);
