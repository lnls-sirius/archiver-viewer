import React from "react";
import { connect } from "react-redux";
import * as S from "./styled";

const mapStateToProps = (props) => {
  return { visible: props.chart.loading };
};

const Loading = (props) => {
  const { visible } = props;

  return (
    <S.LoadingWrapper $visible={visible}>
      <S.LoadingItem />
      <S.LoadingItem />
      <S.LoadingItem />
      <S.LoadingItem />
    </S.LoadingWrapper>
  );
};
export default connect(mapStateToProps)(Loading);
