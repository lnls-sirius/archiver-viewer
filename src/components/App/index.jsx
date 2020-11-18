import React, { Component } from "react";

import LineChart from "../LineChart";
import Controls from "../Controls";
import Intervals from "../Intervals";
import Logo from "../Logo";
import Footer from "../Footer";
import Loading from "../Loading";

import ui from "../../lib/ui";

import * as S from "./styled";

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { timeWindow } = this.props;
    return (
      <S.AppLayout onClick={ui.hideSearchedPVs}>
        <S.HeaderWrapper>
          <Logo />
          <Intervals />
          <Controls />
        </S.HeaderWrapper>
        <LineChart />
        <Loading visible={true} />
        <Footer />
      </S.AppLayout>
    );
  }
}
export default App;
