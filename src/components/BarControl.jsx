import React, {Component} from 'react';
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackward, faForward, faUndo, faRedo, faFileExcel, faCircle, faSearchPlus, faCarSide, faList} from '@fortawesome/free-solid-svg-icons';

import handlers from '../lib/handlers';
import control  from '../lib/control';

import "react-datepicker/dist/react-datepicker.css";
import "../css/bar.css";

class BarControl extends Component {
    constructor(props){
        super(props);
        this.state = {
            zoom:false,
            startDate: new Date(),
            refTimeEnd: true
        };
        this.END = 0;
        this.START = 1;
    }

    handleZoom = (e)=>{
        handlers.zoomClickHandler();
        this.setState({zoom:control.zoomFlags().isZooming});
    }

    handleAuto = ()=>{
        handlers.autoRefreshingHandler();
        this.setState({
            auto:control.autoEnabled(),
            zoom:control.zoomFlags().isZooming});
    }

    handleTooltip = ()=>{
	handlers.singleTipHandler();
	this.setState({
	    singleTip:control.singleTipEnabled()});
    }

    handleDateChange = (e)=>{
        handlers.onChangeDateHandler(e);
        this.setState({startDate:e});
    }

    handleTimeRefChange = (e)=>{
        console.log(e.target.value);
        handlers.updateReferenceTime(e.target.value == this.END);
    }

    render(){
      return <span>
            <select
                onChange={this.handleTimeRefChange}>
                <option value={this.END}>End</option>
                <option value={this.START}>Start</option>
            </select>
            <DatePicker title="Start/end timestamp"
                showTimeSelect
                selected={this.state.startDate}
                onChange={this.handleDateChange}
                timeFormat="HH:mm"
                timeCaption="time"
                dateFormat="dd/MM/yy h:mm aa"
                maxDate={new Date()}
                />
            <FontAwesomeIcon icon={faBackward}   title="Backward" className='header-controls' onClick={()=>{handlers.backTimeWindow()}}/>
            <FontAwesomeIcon icon={faCircle}     title="Now" className='header-controls' onClick={()=>{handlers.updateEndNow()}}/>
            <FontAwesomeIcon icon={faForward}    title="Forward" className='header-controls' onClick={()=>{handlers.forwTimeWindow()}}/>
            <FontAwesomeIcon icon={faUndo}       title="Undo action" className='header-controls' onClick={()=>handlers.undoHandler()}/>
            <FontAwesomeIcon icon={faRedo}       title="Redo action" className='header-controls'  onClick={()=>handlers.redoHandler()}/>
            <FontAwesomeIcon icon={faCarSide}    title="Auto scroll" onClick={this.handleAuto} className={(this.state.auto)?'header-controls active':'header-controls'}/>
            <FontAwesomeIcon icon={faSearchPlus} title="Zoom" onClick={this.handleZoom} className={(this.state.zoom)?'header-controls active':'header-controls'}/>
            <FontAwesomeIcon icon={faFileExcel}  title="Export as xlsx" className='header-controls' onClick={()=>{handlers.exportAs("xlsx")}}/>
	    <FontAwesomeIcon icon={faList}  	 title="Show all in tooltip" onClick={this.handleTooltip} className={(this.state.singleTip)?'header-controls active':'header-controls'}/>
      </span>
    }
}

export default BarControl;
