import React, { Component } from "react";
import { connect } from "react-redux";
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
import { IconProp, SizeProp } from "@fortawesome/fontawesome-svg-core";

import * as S from "./styled";
import { RootState } from "../../reducers";
import handlers from "../../controllers/handlers";
import Seach from "../Search";

interface ControlsReduxProps {
  autoScroll: boolean;
  zooming: boolean;
  singleTooltip: boolean;
  timeReferenceEnd: boolean;
  pending: number;
  timeEnd: string;
  timeStart: string;
}
const mapStateToProps = (state: RootState): ControlsReduxProps => {
  const {
    chart: { autoScroll, zooming, singleTooltip, timeReferenceEnd, timeEnd, timeStart },
    requests: { pending },
  } = state;

  return {
    autoScroll,
    zooming,
    singleTooltip,
    timeReferenceEnd,
    pending,
    timeEnd,
    timeStart,
  };
};

interface ControlsState {
  startDate: Date;
}
interface ControlItemProps {
  icon: IconProp;
  title: string;
  onClick(e?: any): void;
  size: SizeProp;
  isActive?(): boolean;
}
class Controls extends Component<ControlsReduxProps, ControlsState> {
  private items: ControlItemProps[];
  constructor(props: ControlsReduxProps) {
    super(props);
    this.state = {
      startDate: new Date(),
    };
    this.items = [
      {
        icon: faBackward,
        title: "Backward",
        onClick: () => handlers.backTimeWindow(),
        size: "lg",
      },
      {
        icon: faCircle,
        title: "Now",
        onClick: () => handlers.updateEndNow(),
        size: "lg",
      },
      {
        icon: faForward,
        title: "Forward",
        onClick: () => handlers.forwTimeWindow(),
        size: "lg",
      },
      {
        icon: faUndo,
        title: "Undo action",
        onClick: () => handlers.undoHandler(),
        size: "lg",
      },
      {
        icon: faRedo,
        title: "Redo action",
        onClick: () => handlers.redoHandler(),
        size: "lg",
      },
      {
        icon: faCarSide,
        title: "Auto scroll",
        onClick: handlers.autoUpdateHandler,
        isActive: () => this.props.autoScroll,
        size: "lg",
      },
      {
        icon: faSearchPlus,
        title: "Zoom",
        onClick: handlers.zoomClickHandler,
        isActive: () => this.props.zooming,
        size: "lg",
      },
      {
        icon: faFileExcel,
        title: "Export as xlsx",
        onClick: async () => await handlers.exportAsXlsx(),
        size: "lg",
      },
      {
        icon: faList,
        title: "Show all in tooltip",
        onClick: handlers.singleTipHandler,
        isActive: () => this.props.singleTooltip,
        size: "lg",
      },
    ];
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
        <span style={{ padding: "0 5px 0 5px", fontWeight: 500 }}>{`${pending !== 0 ? pending : ""}`}</span>
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

  renderControlIcons() {
    return this.items.map(({ icon, onClick, size, title, isActive }, index) => {
      let active: boolean;
      if (isActive === undefined) {
        active = false;
      } else {
        active = isActive();
      }

      return <S.ControlIcon icon={icon} title={title} onClick={onClick} size={size} $isActive={active} key={index} />;
    });
  }

  render() {
    const { timeEnd, timeStart } = this.props;
    return (
      <S.ControlsWrapper>
        {this.renderLeftGroup()}
        <S.ControlsGroupWrapper>
          {this.renderControlIcons()}
          <S.TimeDisplay>
            <S.TimeDisplayText>{"from"}</S.TimeDisplayText>
            <S.TimeDisplayDate>{`${timeStart}`}</S.TimeDisplayDate>
            <S.TimeDisplayText>{"to"}</S.TimeDisplayText>
            <S.TimeDisplayDate>{`${timeEnd}`}</S.TimeDisplayDate>
          </S.TimeDisplay>
        </S.ControlsGroupWrapper>
      </S.ControlsWrapper>
    );
  }
}
export default connect(mapStateToProps)(Controls);
