import React, { Component } from "react";
import BarControl from './BarControl.jsx';
import SearchPV from 'components/SearchPV.jsx';
import Intervals from 'components/Intervals.jsx';

import '../css/bar.css';

function Logo(props){
        return <span className="header-logo">
          <a>
            <img src="../img/labLogo.png"/>
            <img src="../img/labLogo2.png"/>
          </a>
        </span>
}

class Bar extends Component {
    constructor(props){
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
export default Bar;
