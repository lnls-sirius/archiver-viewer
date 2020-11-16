import React from "react";
import PropTypes from "prop-types";
import chartUtils from "../../lib/chartUtils";

import * as S from "./styled";

const Intervals = (props) => {
  const { windowTime, handleUpdateWindowTime, handleWheel } = props;
  return (
    <S.IntervalsWarpper onWheel={handleWheel}>
      {chartUtils.timeAxisPreferences.map((val, idx) => (
        <S.IntervalsItem
          onClick={(e) => {
            handleUpdateWindowTime(val.id);
          }}
          key={idx}
          pushed={val.id === windowTime}
        >
          {val.text}
        </S.IntervalsItem>
      ))}
    </S.IntervalsWarpper>
  );
};

Intervals.propTypes = {
  windowTime: PropTypes.number.isRequired,
  handleUpdateWindowTime: PropTypes.func.isRequired,
  handleWheel: PropTypes.func.isRequired,
};
export default Intervals;
