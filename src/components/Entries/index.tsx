import React from "react";
import * as S from "./styled";
import { useSelector } from "react-redux";
import Checkbox from "../Checkbox";
import { hideDataset, optimizeDataset, removeDatasetByLabel } from "../../lib/control";
import { RootState } from "../../reducers";

const Entries: React.FC = () => {
  const datasets = useSelector(({ chart: { datasets } }: RootState) => datasets);
  const optimizeHandler = (optimize: boolean, label: string) => {
    optimizeDataset(label, optimize);
  };
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
              onClick={(e: React.MouseEvent) => optimizeHandler(!optimized, label)}
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
export default Entries;
