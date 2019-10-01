import React, {Component} from 'react';
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faBackward, faForward, faUndo, faRedo, faFileExcel, faCircle, faSearchPlus, faCarSide} from '@fortawesome/free-solid-svg-icons';
import { exportAs, undoHandler, redoHandler, onChangeDateHandler, updateEndNow,
        backTimeWindow, forwTimeWindow, zoomClickHandler, autoRefreshingHandler, 
        updateReferenceTime } from '../lib/handlers';

import {zoom_flags, auto_enabled} from '../lib/control';

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
        zoomClickHandler();
        this.setState({zoom:zoom_flags().isZooming});
    }

    handleAuto = ()=>{
        autoRefreshingHandler();
        this.setState({
            auto:auto_enabled(),
            zoom:zoom_flags().isZooming});
    }

    handleDateChange = (e)=>{
        onChangeDateHandler(e);
        this.setState({startDate:e});
    }

    handleTimeRefChange = (e)=>{
        console.log(e.target.value);
        updateReferenceTime(e.target.value == this.END);
    }

    render(){
      return <span>
            <select onChange={this.handleTimeRefChange}>
                <option value={this.END}>End</option>
                <option value={this.START}>Start</option>
            </select>
            <DatePicker
                showTimeSelect
                selected={this.state.startDate}
                onChange={this.handleDateChange}
                timeFormat="HH:mm"
                timeCaption="time"
                dateFormat="dd/MM/yy h:mm aa"
                maxDate={new Date()}
                />
            <FontAwesomeIcon icon={faBackward}  className='header-controls' onClick={()=>{backTimeWindow()}}/>
            <FontAwesomeIcon icon={faCircle}    className='header-controls' onClick={()=>{updateEndNow()}}/>
            <FontAwesomeIcon icon={faForward}   className='header-controls' onClick={()=>{forwTimeWindow()}}/>
            <FontAwesomeIcon icon={faUndo}      className='header-controls' onClick={()=>undoHandler()}/>
            <FontAwesomeIcon icon={faRedo}      className='header-controls'  onClick={()=>redoHandler()}/>
            <FontAwesomeIcon icon={faCarSide}     onClick={this.handleAuto} className={(this.state.auto)?'header-controls active':'header-controls'}/>
            <FontAwesomeIcon icon={faSearchPlus}  onClick={this.handleZoom} className={(this.state.zoom)?'header-controls active':'header-controls'}/>
            <FontAwesomeIcon icon={faFileExcel}  className='header-controls' onClick={()=>{exportAs("xlsx")}}/>
            {/* <button onClick={()=>{backTimeWindow()}}>Backard</button>          
            <button onClick={()=>{updateEndNow()}}>Now</button>          
            <button onClick={()=>{forwTimeWindow()}}>Forward</button>           */}

            {/* <button className={(this.state.zoom)?'active':''} onClick={this.handleZoom}>Zoom</button>          
            <button className={(this.state.auto)?'active':''} onClick={this.handleAuto}>Auto</button> */}
            {/* <span className="header-controls">
                <img onClick={()=>undoHandler()} src="img/undo.png"/>
                <img onClick={()=>redoHandler()} src="img/redo.png"/>  
                <img onClick={()=>{exportAs("xlsx")}}   src="img/excel.ico"/>
            </span>           */}
      </span>
    }
}

export default BarControl;