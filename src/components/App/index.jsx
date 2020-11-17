import React, { Component } from "react";
import LineChart from "../LineChart";
import Controls from "../Controls";
import Intervals from "../Intervals";
import Logo from "../Logo";
import Footer from "../Footer";

import handlers from "../../lib/handlers";
import ui from "../../lib/ui";
import control from "../../lib/control";

import * as S from "./styled";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      windowTime: control.getWindowTime(),
    };
  }

  handleUpdateWindowTime = (windowTimeId) => {
    handlers.updateTimeWindow(windowTimeId);
    this.setState({ windowTime: control.getWindowTime() });
  };

  handleScrollChart = (e) => {
    handlers.scrollChart(e);
    this.setState({ windowTime: control.getWindowTime() });
  };

  render() {
    const { windowTime } = this.state;
    return (
      <S.AppLayout onClick={ui.hideSearchedPVs}>
        <S.HeaderWrapper>
          <Logo />
          <Intervals
            windowTime={windowTime}
            handleUpdateWindowTime={this.handleUpdateWindowTime}
            handleWheel={this.handleScrollChart}
          />
          <Controls />
        </S.HeaderWrapper>
        <LineChart handlers={{ handleWheel: this.handleScrollChart }} />
        <Footer />
      </S.AppLayout>
    );
  }
}
export default App;
