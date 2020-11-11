import React, { Component } from "react";
import PropTypes from "prop-types";
import BarControl from "./BarControl.jsx";
import SearchPV from "components/SearchPV.jsx";
import Intervals from "components/Intervals.jsx";

import "css/bar.css";

import labLogo1 from "./../img/labLogo.png";
import labLogo2 from "./../img/labLogo2.png";

function Logo(props) {
    return <span className="header-logo">
        <a>
            <img src={labLogo1}/>
            <img src={labLogo2}/>
        </a>
    </span>;
}

class Bar extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className='main-bar'>
                <span>
                    <Intervals
                        windowTime={this.props.data.windowTime}
                        handleUpdateWindowTime={this.props.handlers.handleUpdateWindowTime}
                        handleWheel={this.props.handlers.handleWheel}
                        intervals={this.intervals}/>
                    <SearchPV/>
                    <BarControl/>
                </span>
                <span>
                    <Logo/>
                </span>
            </div>
        );
    }
}
Bar.propTypes = {
    data: PropTypes.object.isRequired,
    handlers: PropTypes.object.isRequired,
};
export default Bar;
