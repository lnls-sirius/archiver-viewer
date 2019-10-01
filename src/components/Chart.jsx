import React, { Component } from 'react';
import {startDragging, doDragging, stopDragging } from '../lib/handlers';
import * as handlers from '../lib/handlers';

class Chart extends Component{
    constructor(props){
        super(props);
    }
    /*
$("#archiver_viewer").on('click', handlers.dataClickHandler);
// Binds handlers to the dragging events
$("#archiver_viewer").mousedown(handlers.startDragging);
$("#archiver_viewer").mousemove(handlers.doDragging);
$("#archiver_viewer").mouseup(handlers.stopDragging);
*/
    render(){
        return <div id="canvas_area">
        <canvas id="archiver_viewer" onWheel={this.props.handlers.handleWheel}
//        onClick={handlers.dataClickHandler}
 //       onMouseDown={handlers.startDragging}
  //      onMouseUp={handlers.stopDragging}
   //     onMouseMove={handlers.doDragging}
        width="450" height="450"></canvas>
        <span className="selection_box"></span>
      </div>
    }
}
export default Chart;