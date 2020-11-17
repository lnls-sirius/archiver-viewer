import React, { Component } from "react";
import { connect } from "react-redux";
import {} from "../../features/chart/sliceChart";

import handlers from "../../lib/handlers";
import Seach from "../Search/Search";

import {
  faBackward,
  faForward,
  faCircle,
  faUndo,
  faRedo,
  faFileExcel,
  faSearchPlus,
  faCarSide,
  faList,
} from "@fortawesome/free-solid-svg-icons";

import * as S from "./styled";
const mapStateToProps = (state) => {
  const { autoScroll, zooming, singleTooltip, timeReferenceEnd } = state.chart;

  return {
    autoScroll: autoScroll,
    zooming: zooming,
    singleTooltip: singleTooltip,
    timeReferenceEnd: timeReferenceEnd,
  };
};

class Controls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: new Date(),
    };
  }

  handleDateChange = (e) => {
    handlers.onChangeDateHandler(e);
    this.setState({ startDate: e });
  };

  handleTimeRefChange = (e) => {
    handlers.updateReferenceTime(e.target.value == "true");
  };

  render() {
    const { zooming, autoScroll, singleTooltip } = this.props;
    const { startDate } = this.state;
    return (
      <S.ControlsWrapper>
        <S.ControlsGroupWrapper>
          <Seach />
          <S.DatePickerWrapper
            title="Start/end timestamp"
            showTimeSelect
            selected={startDate}
            onChange={this.handleDateChange}
            timeFormat="HH:mm"
            timeCaption="time"
            dateFormat="dd/MM/yy h:mm aa"
            maxDate={new Date()}
          />
          <S.ControlSelect onChange={this.handleTimeRefChange}>
            <option value={true}>End</option>
            <option value={false}>Start</option>
          </S.ControlSelect>
        </S.ControlsGroupWrapper>
        <S.ControlsGroupWrapper>
          <S.ControlIcon
            icon={faBackward}
            title="Backward"
            onClick={() => {
              handlers.backTimeWindow();
            }}
            size="lg"
          />
          <S.ControlIcon
            icon={faCircle}
            title="Now"
            onClick={() => {
              handlers.updateEndNow();
            }}
            size="lg"
          />
          <S.ControlIcon
            icon={faForward}
            title="Forward"
            onClick={() => {
              handlers.forwTimeWindow();
            }}
            size="lg"
          />

          <S.ControlIcon
            icon={faUndo}
            title="Undo action"
            className="header-controls"
            onClick={() => handlers.undoHandler()}
            size="lg"
          />
          <S.ControlIcon
            icon={faRedo}
            title="Redo action"
            className="header-controls"
            onClick={() => handlers.redoHandler()}
            size="lg"
          />
          <S.ControlIcon
            icon={faCarSide}
            title="Auto scroll"
            onClick={handlers.autoRefreshingHandler}
            $isActive={autoScroll}
            size="lg"
          />
          <S.ControlIcon
            icon={faSearchPlus}
            title="Zoom"
            onClick={handlers.zoomClickHandler}
            $isActive={zooming}
            size="lg"
          />
          <S.ControlIcon
            icon={faFileExcel}
            title="Export as xlsx"
            className="header-controls"
            onClick={() => handlers.exportAs("xlsx")}
            size="lg"
          />
          <S.ControlIcon
            icon={faList}
            title="Show all in tooltip"
            onClick={handlers.singleTipHandler}
            $isActive={singleTooltip}
            size="lg"
          />
        </S.ControlsGroupWrapper>
      </S.ControlsWrapper>
    );
  }
}
export default connect(mapStateToProps)(Controls);
