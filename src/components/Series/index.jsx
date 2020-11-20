import React, { useState } from "react";
import { connect } from "react-redux";
import Checkbox from "../Checkbox";

import { toggleAxisType, toggleAutoY } from "../../lib/control";
import { setAxisYLimitManual, setAxisYLimitMax, setAxisYLimitMin } from "../../features/chart/sliceChart";
const mapStateToProps = (state) => {
  return { dataAxis: state.chart.dataAxis };
};
const mapDispatch = { setAxisYLimitManual, setAxisYLimitMax, setAxisYLimitMin };
import * as S from "./styled";
const KEY_ENTER = 13;
const Series = ({ dataAxis, setAxisYLimitManual, setAxisYLimitMax, setAxisYLimitMin }) => {
  const [yMinState, setYMin] = useState("");
  const [yMaxState, setYMax] = useState("");

  const handleYMin = (e, id) => {
    setYMin(e.target.value);
  };

  const handleYMax = (e, id) => {
    setYMax(e.target.value);
  };

  const handleSubmitYMin = (e, id) => {
    if (e.which !== KEY_ENTER) return;

    const val = parseFloat(yMinState);
    if (val) {
      setAxisYLimitMin({ id: id, yMin: val });
    }
  };

  const handleSubmitYMax = (e, id) => {
    if (e.which !== KEY_ENTER) return;

    const val = parseFloat(yMaxState);
    if (val) {
      setAxisYLimitMax({ id: id, yMax: val });
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
              onClick={() => setAxisYLimitManual({ id: id, yLimitManual: !yLimitManual })}
            />
            <S.InputWarpper>
              <S.Input
                $visible={yLimitManual}
                onChange={(e) => handleYMax(e, id)} /*onKeyDown={handleSubmit}*/
                onKeyDown={(e) => handleSubmitYMax(e, id)}
                placeholder={`yMax ${yMax ? yMax : ""}`}
                type="text"
                value={yMaxState}
              />
              <S.Input
                $visible={yLimitManual}
                onChange={(e) => handleYMin(e, id)} /*onKeyDown={handleSubmit}*/
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

export default connect(mapStateToProps, mapDispatch)(Series);
