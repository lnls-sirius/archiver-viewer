import React, { Component } from "react";

import LineChart from "../LineChart";
import Controls from "../Controls";
import Intervals from "../Intervals";
import Logo from "../Logo";
//import Footer from "../Footer";
import Loading from "../Loading";
import Entries from "../Entries";
import Series from "../Series";
import SearchResults from "../SearchResults";

import ui from "../../lib/ui";

import * as S from "./styled";

const App = () => {
  return (
    <S.AppLayout onClick={ui.hideSearchedPVs}>
      <S.HeaderWrapper>
        <Logo />
        <Intervals />
        <Controls />
      </S.HeaderWrapper>
      <SearchResults />
      <LineChart />
      <S.FooterWrapper>
        <Loading visible={true} />
        <Entries />
        <Series />
      </S.FooterWrapper>
    </S.AppLayout>
  );
};
export default App;
