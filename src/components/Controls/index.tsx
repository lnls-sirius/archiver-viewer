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
  faInfo
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
  selectedTime: string;
}
const mapStateToProps = (state: RootState): ControlsReduxProps => {
  const {
    chart: { autoScroll, zooming, singleTooltip, timeReferenceEnd, timeEnd, timeStart, selectedTime},
    requests: { pending }
  } = state;

  return {
    autoScroll,
    zooming,
    singleTooltip,
    timeReferenceEnd,
    pending,
    timeEnd,
    timeStart,
    selectedTime
  };
};

interface ControlsState {
  isEnd: boolean;
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
      isEnd: true
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
      {
        icon: faInfo,
        title: "Shortcuts information",
        onClick: ()  => handlers.showInfo(),
        size: "lg",
      },
    ];
  }

  handleDateChange = (date: Date) => {
    handlers.onChangeDateHandler(date);
  };

  handleTimeRefChange = (e: any) => {
    const isEndSelected = parseInt(e.target.value) === 1;
    handlers.updateReferenceTime(isEndSelected);
    this.setState({isEnd: isEndSelected});
  };

  renderLeftGroup = () => {
    const { isEnd } = this.state;
    const { pending, timeStart, timeEnd } = this.props;

    return (
      <S.ControlsGroupWrapper>
        <span style={{ padding: "0 5px 0 5px", fontWeight: 500 }}>{`${pending !== 0 ? pending : ""}`}</span>
        <Seach />
        <S.DatePickerWrapper
          title="Start/end timestamp"
          showTimeSelect
          selected={new Date(isEnd?timeEnd:timeStart)}
          onChange={this.handleDateChange}
          timeFormat="HH:mm"
          timeCaption="time"
          dateFormat="dd/MM/yy HH:mm:ss"
          maxDate={new Date()}
        />
        <S.ControlSelect onChange={this.handleTimeRefChange}>
          <option value={1}>End</option>
          <option value={0}>Start</option>
        </S.ControlSelect>
      </S.ControlsGroupWrapper>
    );
  };

  handleTimeChange = async (date: Date) => {
    handlers.onChangeSelectedTime(date);
  };

  renderTimeSelect = () => {
    const { selectedTime } = this.props;

    let timeDisplay = (selectedTime != null && selectedTime != undefined) ? new Date(selectedTime):new Date();

    return (
      <S.DatePickerWrapper
        title="Diff timestamp"
        showTimeSelect
        selected={timeDisplay}
        onChange={this.handleTimeChange}
        timeFormat="HH:mm"
        timeCaption="time"
        dateFormat="dd/MM/yy HH:mm:ss"
        maxDate={new Date()}
      />
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
        Diff Time: {this.renderTimeSelect()}
        <S.ControlsGroupWrapper>
          {this.renderControlIcons()}
          <S.TimeDisplay>
            <S.TimeDisplayText>{"from"}</S.TimeDisplayText>
            <S.TimeDisplayDate>{`${(new Date(timeStart)).toLocaleString('pt-BR')}`}</S.TimeDisplayDate>
            <S.TimeDisplayText>{"to"}</S.TimeDisplayText>
            <S.TimeDisplayDate>{`${(new Date(timeEnd)).toLocaleString('pt-BR')}`}</S.TimeDisplayDate>
          </S.TimeDisplay>
        </S.ControlsGroupWrapper>
      </S.ControlsWrapper>
    );
  }
}
export default connect(mapStateToProps)(Controls);
