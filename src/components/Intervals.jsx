import React, { Component } from 'react';
import { timeAxisPreferences } from '../lib/chartUtils';

import '../css/bar.css';

class Intervals extends Component {
    constructor(props){
        super(props);
    }

    renderButtonClass = (windowTimeId)=>{
        if(windowTimeId === this.props.windowTime){
            return 'time-button pushed';}
        else{
            return 'time-button';
        }
    }

    render(){    
        return <span onWheel={this.props.handleWheel}>
            {timeAxisPreferences.map((val, idx)=> 
            <button
                onClick={(e)=>{this.props.handleUpdateWindowTime(val['id'])}} 
                key={idx} className={this.renderButtonClass(val['id'])}>{val['text']}
            </button>)}
        </span>
    }
}
export default Intervals;