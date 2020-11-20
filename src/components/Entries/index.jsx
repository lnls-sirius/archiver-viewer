import React from "react";
import * as S from "./styled";
import { connect } from "react-redux";
import Checkbox from "../Checkbox";
import { hideDataset, optimizeDataset, removeDatasetByLabel } from "../../lib/control";

// hideAxis, optimizeHandler, removeHandler

const mapStateToProps = (props) => {
  return { datasets: props.chart.datasets };
};

const Entries = (props) => {
  const { datasets } = props;

  const handleRemove = () => {};
  return (
    <S.EntriesWrapper>
      {datasets.map(({ label, yAxisID, backgroundColor, visible, pv: { optimized } }, i) => {
        return (
          <S.EntryGroup key={i}>
            <S.Color $bgcolor={backgroundColor} onClick={() => hideDataset(label)}>
              {visible ? <S.VisibleIndicator /> : <S.HiddenIndicator />}
            </S.Color>
            <S.Text>{label}</S.Text>
            <S.EguText>{yAxisID}</S.EguText>
            <Checkbox
              onClick={(e) => optimizeDataset(label, e.target.checked)}
              checked={optimized}
              text="Optimize?"
              tooltip="Uncheck if you want raw data from the server"
            />
            <S.Button onClick={() => removeDatasetByLabel(label)}>Remove</S.Button>
          </S.EntryGroup>
        );
      })}
    </S.EntriesWrapper>
  );
};
export default connect(mapStateToProps)(Entries);
