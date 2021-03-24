import React from "react";
import * as S from "./styled";
import { useSelector } from "react-redux";
import Checkbox from "../Checkbox";

import ChartController from "../../controllers/Chart";
import { RootState } from "../../reducers";

const Entries: React.FC = () => {
  const datasets = useSelector(({ chart: { datasets } }: RootState) => datasets);

  const optimizeHandler = async (label: string, optimize: boolean) => {
    await ChartController.setDatasetOptimized(label, optimize);
  };
  const removeDataset = async (name: string) => {
    await ChartController.removeDataset(name);
  };
  const hideDataset = (name: string) => {
    ChartController.hideDataset(name);
  };

  return (
    <S.EntriesWrapper>
      {datasets.map(({ label, yAxisID, backgroundColor, visible, pv: { optimized, bins } }) => {
        return (
          <S.EntryGroup key={label}>
            <S.Color title="Dataset visibility" $bgcolor={backgroundColor} onClick={() => hideDataset(label)}>
              {visible ? <S.VisibleIndicator /> : <S.HiddenIndicator />}
            </S.Color>
            <S.Text title="PV name">{label}</S.Text>
            <S.EguText title="y axis label">{yAxisID}</S.EguText>
            <Checkbox
              onClick={() => optimizeHandler(label, !optimized)}
              checked={optimized}
              text="Optimize?"
              tooltip="Uncheck if you want raw data from the server"
            />
            {optimized ? <a title="Number of points when optimizing">{bins}</a> : null}
            <S.Button title="Remove dataset" onClick={() => removeDataset(label)}>
              Remove
            </S.Button>
          </S.EntryGroup>
        );
      })}
    </S.EntriesWrapper>
  );
};
export default Entries;
