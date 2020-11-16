import React, { Component } from "react";
import PropTypes from "prop-types";

class Chart extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div id="canvas_area">
        <canvas id="archiver_viewer" onWheel={this.props.handlers.handleWheel} width="450" height="450"></canvas>
        <span className="selection_box"></span>
      </div>
    );
  }
}
Chart.propTypes = {
  data: PropTypes.object,
  handlers: PropTypes.object.isRequired,
};
export default Chart;
