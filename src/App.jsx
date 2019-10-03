import React, {Component} from "react";
import Bar from "./components/Bar.jsx";
import Chart from "./components/Chart.jsx";

import {updateTimeWindow, scrollChart} from './lib/handlers';
import { hideSearchedPVs } from './lib/ui';
import {getWindowTime} from './lib/control';


class App extends Component{
    constructor(props){
        super(props);
        this.state = {
            windowTime:getWindowTime()            
        };
    }

    handleUpdateWindowTime = (windowTimeId)=>{
        updateTimeWindow(windowTimeId);
        this.setState({windowTime:getWindowTime()});
    }

    handleScrollChart = (e) => {
        e.preventDefault();
        scrollChart(e);
        this.setState({windowTime:getWindowTime()});
    }

    render(){
        return (
            <div onClick={hideSearchedPVs}>
                <Bar 
                    handlers={{
                        handleScrollChart:this.handleScrollChart,
                        handleUpdateWindowTime:this.handleUpdateWindowTime,
                        handleWheel:this.handleScrollChart
                    }}
                    data={{windowTime:this.state.windowTime}}/>
                <Chart handlers={{handleWheel:this.handleScrollChart}}/>
            </div>
        );
    }

}
export default App;
