import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Checkbox from "../Checkbox";

import * as S from "./styled";
import { RootState } from "../../reducers";
import ChartController from "../../controllers/Chart";

const KEY_ENTER = 13;
const Series: React.FC = () => {
  const dataAxis = useSelector(({ chart: { dataAxis } }: RootState) => dataAxis);
  const [yMinState, setYMin] = useState("");
  const [yMaxState, setYMax] = useState("");

  const handleYMin = (e: any, _name: string) => {
    setYMin(e.target.value);
  };

  const handleYMax = (e: any, _name: string) => {
    setYMax(e.target.value);
  };

  const handleSubmitYMin = (e: any, id: any) => {
    if (e.which !== KEY_ENTER) {
      return;
    }

    const val = parseFloat(yMinState);
    if (val) {
      ChartController.setAxisYMin(id, val);
    }
  };

  const handleSubmitYManual = (id: string, manual: boolean) => {
    ChartController.setAxisYManual(id, manual);
  };

  const handleSubmitYMax = (e: any, id: any) => {
    if (e.which !== KEY_ENTER) {
      return;
    }

    const val = parseFloat(yMaxState);
    if (val) {
      ChartController.setAxisYMax(id, val);
    }
  };
  return (
    <S.SeriesWrapper>
      {dataAxis.map(({ id, yMin, yMax, yLimitManual, isLog }) => {
        return (
          <S.SerieWrapper key={id}>
            Chart Series: <S.SerieName>{id}</S.SerieName>
            <Checkbox
              text="Log"
              tooltip="Logarithmic axis"
              checked={isLog}
              onClick={() => ChartController.toggleAxisType(id)}
            />
            <Checkbox
              text="Manual Y Limit"
              tooltip="Manually define Y limits"
              checked={yLimitManual}
              onClick={() => handleSubmitYManual(id, !yLimitManual)}
            />
            <S.InputWarpper>
              <S.Input
                $visible={yLimitManual}
                onChange={(e) => handleYMax(e, id)}
                onKeyDown={(e) => handleSubmitYMax(e, id)}
                placeholder={`yMax ${yMax ? yMax : ""}`}
                type="text"
                value={yMaxState}
              />
              <S.Input
                $visible={yLimitManual}
                onChange={(e) => handleYMin(e, id)}
                onKeyDown={(e) => handleSubmitYMin(e, id)}
                placeholder={`yMin ${yMin ? yMin : ""}`}
                type="text"
                value={yMinState}
              />
            </S.InputWarpper>
          </S.SerieWrapper>
        );
      })}
    </S.SeriesWrapper>
  );
};

export default Series;
