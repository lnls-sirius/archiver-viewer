import React, { Component } from "react";
import PropTypes from "prop-types";
import chartUtils from "../lib/chartUtils";

import "../css/bar.css";

class Intervals extends Component {
    constructor(props) {
        super(props);
    }

    renderButtonClass = (windowTimeId)=>{
        if (windowTimeId === this.props.windowTime) {
            return "time-button pushed";
        } else {
            return "time-button";
        }
    }

    render() {
        return <span onWheel={this.props.handleWheel}>
            {chartUtils.timeAxisPreferences.map((val, idx)=>
                <button
                    onClick={(e)=>{
                        this.props.handleUpdateWindowTime(val.id);
                    }}
                    key={idx} className={this.renderButtonClass(val.id)}>{val.text}
                </button>)}
        </span>;
    }
}

Intervals.propTypes = {
    windowTime: PropTypes.number.isRequired,
    handleUpdateWindowTime: PropTypes.func.isRequired,
    handleWheel:  PropTypes.func.isRequired,
};
export default Intervals;
