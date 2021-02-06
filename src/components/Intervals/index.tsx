import React from "react";
import { useSelector } from "react-redux";

import * as S from "./styled";

import chartUtils from "../../utility/chartUtils";
import handlers from "../../lib/handlers";
import { RootState } from "../../reducers";

const Intervals: React.FC = () => {
  const windowTime = useSelector(({ chart: { windowTime } }: RootState) => windowTime);

  const handleUpdateWindowTime = (windowTimeId: number) => handlers.updateTimeWindow(windowTimeId);
  const handleScrollChart = (e: React.WheelEvent) => handlers.scrollChart(e);

  return (
    <S.IntervalsWarpper onWheel={handleScrollChart}>
      {chartUtils.timeAxisPreferences.map((val, idx) => (
        <S.IntervalsItem onClick={() => handleUpdateWindowTime(val.id)} key={idx} pushed={val.id === windowTime}>
          {val.text}
        </S.IntervalsItem>
      ))}
    </S.IntervalsWarpper>
  );
};
export default Intervals;
