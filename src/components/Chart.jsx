import React, { Component } from 'react';

class Chart extends Component{
    constructor(props){
        super(props);
    }
    render(){
        return <div id="canvas_area">
        <canvas id="archiver_viewer" onWheel={this.props.handlers.handleWheel}
        width="450" height="450"></canvas>
        <span className="selection_box"></span>
      </div>
    }
}
export default Chart;