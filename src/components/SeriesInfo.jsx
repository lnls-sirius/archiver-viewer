import React, { Component } from "react";

class SeriesInfo extends Component {
    constructor(props) {
        super();

        this.state = {
            pvName:'PVName',
            color:'#ff0000',
            optimize:false,
            logScale:false,
        };

    }
    flip = (e)=>{
        this.setState({optimize:e.target.checked});
    }
    color = (e)=>{
        this.setState({color:e.target.value});
    }

    render() {
        return (
            <span>
                <span className="color-picker">
                    <input type="color" value={this.state.color} onChange={this.color}/>
                </span>
                <span>{this.state.pvName}</span>
                <button>Info</button>
                <label>
                    <input type="checkbox" onChange={ this.flip } checked={this.props.optimize}/>
                    <span className="checkmark"></span>
                    <label>Optimize?</label>
                </label>
                <button>X</button>
            </span>
       );
    }

}
export default SeriesInfo;
