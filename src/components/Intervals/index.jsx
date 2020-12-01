import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import * as S from "./styled";

import chartUtils from "../../lib/chartUtils";
import handlers from "../../lib/handlers";

const mapStateToProps = (state) => {
  const { windowTime } = state.chart;

  return { windowTime: windowTime };
};

const Intervals = (props) => {
  const { windowTime } = props;
  const handleUpdateWindowTime = (windowTimeId) => handlers.updateTimeWindow(windowTimeId);
  const handleScrollChart = (e) => handlers.scrollChart(e);

  return (
    <S.IntervalsWarpper onWheel={handleScrollChart}>
      {chartUtils.timeAxisPreferences.map((val, idx) => (
        <S.IntervalsItem onClick={(e) => handleUpdateWindowTime(val.id)} key={idx} pushed={val.id === windowTime}>
          {val.text}
        </S.IntervalsItem>
      ))}
    </S.IntervalsWarpper>
  );
};

Intervals.propTypes = {
  windowTime: PropTypes.number.isRequired,
};
export default connect(mapStateToProps)(Intervals);
