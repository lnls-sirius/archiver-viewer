import React, { Component } from "react";

import handlers from "../../lib/handlers";
import control from "../../lib/control";

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

class Controls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      autoEnabled: control.autoEnabled(),
      refTimeEnd: true,
      singleTip: control.singleTipEnabled(),
      startDate: new Date(),
      zoom: control.zoomFlags().isZooming,
    };
    this.END = 0;
    this.START = 1;
  }

  handleZoom = (e) => {
    handlers.zoomClickHandler();
    this.setState({ zoom: control.zoomFlags().isZooming });
  };

  handleAuto = () => {
    handlers.autoRefreshingHandler();
    this.setState({
      auto: control.autoEnabled(),
      zoom: control.zoomFlags().isZooming,
    });
  };

  handleTooltip = async () => {
    await handlers.singleTipHandler().then((e) => {
      this.setState({ singleTip: e });
    });
  };

  handleDateChange = (e) => {
    handlers.onChangeDateHandler(e);
    this.setState({ startDate: e });
  };

  handleTimeRefChange = (e) => {
    console.log(e.target.value);
    handlers.updateReferenceTime(e.target.value === this.END);
  };

  render() {
    const { zoom, startDate, singleTip, auto } = this.state;
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
          <S.ControlSelect nonChange={this.handleTimeRefChange}>
            <option value={this.END}>End</option>
            <option value={this.START}>Start</option>
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
          <S.ControlIcon icon={faCarSide} title="Auto scroll" onClick={this.handleAuto} $isActive={auto} size="lg" />
          <S.ControlIcon icon={faSearchPlus} title="Zoom" onClick={this.handleZoom} $isActive={zoom} size="lg" />
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
            onClick={this.handleTooltip}
            $isActive={singleTip}
            size="lg"
          />
        </S.ControlsGroupWrapper>
      </S.ControlsWrapper>
    );
  }
}
export default Controls;
