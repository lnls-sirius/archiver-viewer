import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { setWindowTime } from "../../features/chart/sliceChart";

import * as S from "./styled";

import { Chart } from "chart.js";

import { options } from "./contents";
import control from "../../lib/control";
import ui from "../../lib/ui";
import handlers from "../../lib/handlers";

const mapDispatch = { setWindowTime };

class LineChart extends Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    this.myChart = new Chart(this.chartRef.current, { type: "line", data: [], options });
    control.init(this.myChart);

    ui.hideWarning();
    ui.hideSearchWarning();
    control.loadFromURL(window.location.search);
  }

  handleScrollChart = (e) => {
    handlers.scrollChart(e);
  };

  render() {
    return (
      <S.LineChartWrapper>
        <canvas
          ref={this.chartRef}
          onWheel={this.handleScrollChart}
          onMouseDown={handlers.startDragging}
          onMouseMove={handlers.doDragging}
          onMouseUp={handlers.stopDragging}
        />
        <span className="selection_box"></span>
      </S.LineChartWrapper>
    );
  }
}
LineChart.propTypes = {
  data: PropTypes.object,
  setWindowTime: PropTypes.func.isRequired,
};

export default connect(null, mapDispatch)(LineChart);
