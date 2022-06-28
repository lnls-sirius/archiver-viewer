import React from "react";
import { useSelector } from "react-redux";

import * as S from "./styled";

import chartUtils from "../../utility/chartUtils";
import handlers from "../../controllers/handlers";
import { RootState } from "../../reducers";
import { TimeUnits } from "../../utility/TimeAxis/TimeAxisConstants";

interface intervalSelected{
  value: number;
  unit: string;
}

const CustomInterval: React.FC<intervalSelected> = ({value}) => {

  return (
    <S.IntervalWrapper>
      <S.IntervalInput
        type="number"
        value={value}/>
      <S.UnitInput>
        {
          Object.entries(TimeUnits).map(([key, value]) => {
            return(
              <option value="key">{value}</option>
            );
          })
        }
      </S.UnitInput>
    </S.IntervalWrapper>
  );
}

const Intervals: React.FC = () => {
  const windowTime = useSelector(({ chart: { windowTime } }: RootState) => windowTime);

  const handleUpdateWindowTime = (windowTimeId: number) => handlers.updateTimeWindow(windowTimeId);

  return (
    <S.IntervalsWarpper>
      {chartUtils.timeAxisPreferences.map((val, idx) => (
        <S.IntervalsItem onClick={() => handleUpdateWindowTime(val.id)} key={idx} pushed={val.id === windowTime}>
          {val.text}
        </S.IntervalsItem>
      ))}
      <CustomInterval
        value={
          parseInt(chartUtils.timeAxisPreferences[windowTime].text)}
        unit={chartUtils.timeAxisPreferences[windowTime].unit}/>
    </S.IntervalsWarpper>
  );
};
export default Intervals;
