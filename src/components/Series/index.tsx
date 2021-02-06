import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Checkbox from "../Checkbox";

import { toggleAxisType } from "../../lib/control";
import { setAxisYLimitManual, setAxisYLimitMax, setAxisYLimitMin } from "../../features/chart/sliceChart";

import * as S from "./styled";
import { RootState } from "../../reducers";

const KEY_ENTER = 13;
const Series: React.FC = () => {
  const dataAxis = useSelector(({ chart: { dataAxis } }: RootState) => dataAxis);
  const dispatch = useDispatch();
  const [yMinState, setYMin] = useState("");
  const [yMaxState, setYMax] = useState("");

  const handleYMin = (e: any, id: any) => {
    setYMin(e.target.value);
  };

  const handleYMax = (e: any, id: any) => {
    setYMax(e.target.value);
  };

  const handleSubmitYMin = (e: any, id: any) => {
    if (e.which !== KEY_ENTER) {
      return;
    }

    const val = parseFloat(yMinState);
    if (val) {
      dispatch(setAxisYLimitMin({ id: id, yMin: val }));
    }
  };

  const handleSubmitYMax = (e: any, id: any) => {
    if (e.which !== KEY_ENTER) {
      return;
    }

    const val = parseFloat(yMaxState);
    if (val) {
      dispatch(setAxisYLimitMax({ id: id, yMax: val }));
    }
  };

  return (
    <S.SeriesWrapper>
      {dataAxis.map(({ id, type, display, yMin, yMax, yLimitManual, isLog }) => {
        return (
          <S.SerieWrapper key={id}>
            Chart Series: <S.SerieName>{id}</S.SerieName>
            <Checkbox text="Log" tooltip="Logarithmic axis" checked={isLog} onClick={() => toggleAxisType(id)} />
            <Checkbox
              text="Manual Y Limit"
              tooltip="Manually define Y limits"
              checked={yLimitManual}
              onClick={() => dispatch(setAxisYLimitManual({ id: id, yLimitManual: !yLimitManual }))}
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
