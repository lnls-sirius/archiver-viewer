import React from "react";
import useEventListener from '@use-it/event-listener'
import { useSelector } from "react-redux";

import { ShortcutsDispatcher } from "../../utility/Dispatchers";
import LineChart from "../LineChart";
import Controls from "../Controls";
import Intervals from "../Intervals";
import Logo from "../Logo";
import Loading from "../Loading";
import Entries from "../Entries";
import Series from "../Series";
import SearchResults from "../SearchResults";
import AlertDisplay from "../AlertDisplay";
import Footer from "../Footer";
import * as S from "./styled";


const App: React.FC = () => {

  function keyRegister( keyObj: any ) {
    ShortcutsDispatcher.KeyPress(keyObj.key);
  }

  useEventListener('keydown', keyRegister);

  return (
    <S.AppLayout>
      <S.HeaderWrapper>
        <Logo />
        <Intervals />
        <Controls />
      </S.HeaderWrapper>
      <SearchResults />
      <LineChart />
      <AlertDisplay />
      <S.FooterWrapper>
        <Loading />
        <Entries />
        <Series />
        <Footer />
      </S.FooterWrapper>
    </S.AppLayout>
  );
};
export default App;
