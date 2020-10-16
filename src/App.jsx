import React, {Component} from "react";
import Bar from "./components/Bar.jsx";
import Chart from "./components/Chart.jsx";

import handlers from "./lib/handlers";
import ui from "./lib/ui";
import control from "./lib/control";


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            windowTime: control.getWindowTime()
        };
    }

    handleUpdateWindowTime = (windowTimeId)=>{
        handlers.updateTimeWindow(windowTimeId);
        this.setState({windowTime: control.getWindowTime()});
    }

    handleScrollChart = (e) => {
        handlers.scrollChart(e);
        this.setState({windowTime: control.getWindowTime()});
    }

    render() {
        return (
            <div onClick={ui.hideSearchedPVs}>
                <Bar
                    handlers={{
                        handleScrollChart: this.handleScrollChart,
                        handleUpdateWindowTime: this.handleUpdateWindowTime,
                        handleWheel: this.handleScrollChart
                    }}
                    data={{windowTime: this.state.windowTime}}/>
                <Chart handlers={{handleWheel: this.handleScrollChart}}/>
            </div>
        );
    }

}
export default App;
