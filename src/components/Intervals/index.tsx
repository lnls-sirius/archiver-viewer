import React, { useEffect, useState } from "react";
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

const CustomInterval: React.FC<intervalSelected> = ({value, unit}) => {
  const [time, setValue] = useState(value);

  function handleSubmit(evt: React.KeyboardEvent){
    if(isNaN(time)){
      handlers.updateTimeWindowCustom(1, unit);
    }else if(evt.key === "Enter"){
      handlers.updateTimeWindowCustom(time, unit);
    }
  };

  useEffect(() => {
    setValue(value);
  }, [value]);

  return (
    <S.IntervalWrapper>
      <S.IntervalInput
        type="number"
        value={time}
        step="0.1"
        onChange={(evt) => setValue(parseFloat(evt.target.value))}
        onKeyDown={handleSubmit}/>
      <S.UnitInput
        onChange={(evt) => handlers.updateTimeWindowCustom(time, evt.target.value)}>
        {
          Object.entries(TimeUnits).map(([key, value]) => {
            let unitShort = value[0];
            if(key == 'Year' || key == 'Month'){
              unitShort = unitShort.toUpperCase();
            }
            if(value == unit){
              return(
                <S.opt value={value} selected>{unitShort}</S.opt>
              );
            }else{
              return(
                <S.opt value={value}>{unitShort}</S.opt>
              );
            }
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
          parseFloat(chartUtils.timeAxisPreferences[windowTime].text)}
        unit={chartUtils.timeAxisPreferences[windowTime].totalUnit}/>
    </S.IntervalsWarpper>
  );
};
export default Intervals;
