import React, { Component } from "react";
import { connect } from "react-redux";

import handlers from "../../controllers/handlers";
import Seach from "../Search";

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
import { RootState } from "../../reducers";

interface ControlsReduxProps {
  autoScroll: boolean;
  zooming: boolean;
  singleTooltip: boolean;
  timeReferenceEnd: boolean;
  pending: number;
}
const mapStateToProps = (state: RootState): ControlsReduxProps => {
  const {
    chart: { autoScroll, zooming, singleTooltip, timeReferenceEnd },
    requests: { pending },
  } = state;

  return {
    autoScroll,
    zooming,
    singleTooltip,
    timeReferenceEnd,
    pending,
  };
};

interface ControlsState {
  startDate: Date;
}
class Controls extends Component<ControlsReduxProps, ControlsState> {
  constructor(props: ControlsReduxProps) {
    super(props);
    this.state = {
      startDate: new Date(),
    };
  }

  handleDateChange = (date: Date) => {
    handlers.onChangeDateHandler(date);
    this.setState({ startDate: date });
  };

  handleTimeRefChange = (e: any) => {
    // eslint-disable-next-line radix
    handlers.updateReferenceTime(parseInt(e.target.value) === 1);
  };

  renderLeftGroup = () => {
    const { startDate } = this.state;
    const { pending } = this.props;

    return (
      <S.ControlsGroupWrapper>
        <span style={{ padding: "0 5px 0 5px", fontWeight: 500 }}>{`${pending}`}</span>

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
          <option value={1}>End</option>
          <option value={0}>Start</option>
        </S.ControlSelect>
      </S.ControlsGroupWrapper>
    );
  };
  render() {
    const { zooming, autoScroll, singleTooltip } = this.props;
    return (
      <S.ControlsWrapper>
        {this.renderLeftGroup()}
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
            onClick={handlers.autoUpdateHandler}
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
            onClick={async () => await handlers.exportAsXlsx()}
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
