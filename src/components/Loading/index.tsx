import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers";
import * as S from "./styled";

const Loading: React.FC = () => {
  const visible = useSelector(({ chart: { loading } }: RootState) => loading);

  return (
    <S.LoadingWrapper $visible={visible}>
      <S.LoadingItem />
      <S.LoadingItem />
      <S.LoadingItem />
      <S.LoadingItem />
    </S.LoadingWrapper>
  );
};
export default Loading;
