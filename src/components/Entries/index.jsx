import React from "react";
import * as S from "./styled";
import { connect } from "react-redux";

import control from "../../lib/control";

// hideAxis, optimizeHandler, removeHandler

const mapStateToProps = (props) => {
  return { datasets: props.chart.datasets };
};

const Entries = (props) => {
  const { datasets } = props;
  return (
    <S.EntriesWrapper>
      {datasets.map((dataset, i) => {
        const { label, yAxisID, backgroundColor } = dataset;
        return (
          <S.EntryGroup key={i}>
            <S.Color $bgcolor={backgroundColor} />
            <S.Text>{label}</S.Text>
            <S.EguText>{yAxisID}</S.EguText>
            <S.Button>Remove</S.Button>
          </S.EntryGroup>
        );
      })}
    </S.EntriesWrapper>
  );
};
export default connect(mapStateToProps)(Entries);
