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
  activate: (active: boolean) => void;
}

const CustomInterval: React.FC<intervalSelected> = ({value, unit, activate}) => {
  const [time, setValue] = useState(value);
  const [unitInput, setUnitInput] = useState(unit);

  function handleSubmit(evt: React.KeyboardEvent){
    if(isNaN(time)){
      handlers.updateTimeWindowCustom(1, unit);
    }else if(evt.key === "Enter"){
      handlers.updateTimeWindowCustom(time, unitInput);
    }
    activate(false);
  };

  function handleChange(evt: React.ChangeEvent<HTMLSelectElement>){
    setUnitInput(evt.target.value);
    handlers.updateTimeWindowCustom(time, evt.target.value);
    activate(false);
  };

  useEffect(() => {
    setValue(value);
    activate(true);
  }, [value]);

  useEffect(() => {
    setUnitInput(unit);
    activate(true);
  }, [unit]);

  return (
    <S.IntervalWrapper>
      Interval:
      <S.IntervalInput
        type="number"
        value={time}
        step="1"
        min="0"
        onChange={(evt) => setValue(parseInt(evt.target.value))}
        onKeyDown={handleSubmit}/>
      <S.UnitInput
        value={unitInput}
        onChange={handleChange}>
        {
          Object.entries(TimeUnits).map(([key, value]) => {
            let unitShort = value[0];
            if(key == 'Year' || key == 'Month'){
              unitShort = unitShort.toUpperCase();
            }
            return(
              <S.opt value={value}>{unitShort}</S.opt>
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
  const [intervalAct, setIntervalAct] = useState(true);

  return (
    <S.IntervalsWarpper>
      {chartUtils.timeAxisPreferences.map((val, idx) => (
        <S.IntervalsItem onClick={() => handleUpdateWindowTime(val.id)} key={idx} pushed={intervalAct?val.id === windowTime:false}>
          {val.text}
        </S.IntervalsItem>
      ))}
      <CustomInterval
        value={
          parseInt(chartUtils.timeAxisPreferences[windowTime].text)}
        unit={chartUtils.timeAxisPreferences[windowTime].totalUnit}
        activate={setIntervalAct}/>
    </S.IntervalsWarpper>
  );
};
export default Intervals;
