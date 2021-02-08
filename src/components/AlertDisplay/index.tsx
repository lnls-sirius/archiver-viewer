import React from "react";
import * as S from "./styled";
import { connect } from "react-redux";

import Alert from "../Alert";
import { RootState } from "../../reducers";
import { Entry } from "../../features/status";
import { MessageLevel } from "../../utility/consts/MessageLevel";

const mapStateToProps = ({ status: { entries } }: RootState) => {
  return { entries };
};

interface AlertProps {
  entries: Entry[];
}
interface AlertStates {
  visible: boolean;
}

class AlertDisplay extends React.Component<AlertProps, AlertStates> {
  private displayTimer: any = null;
  private lastEntryID: number = null;
  private MAX_ALERTS = 1;

  constructor(props: AlertProps | Readonly<AlertProps>) {
    super(props);
    this.state = { visible: true };
  }

  renderAlerts = (): JSX.Element[] => {
    const { entries } = this.props;
    const alerts: JSX.Element[] = [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const hasDisplayedTheMaxAmount = entries.length - this.MAX_ALERTS > entries.length - i;
      if (hasDisplayedTheMaxAmount) {
        break;
      }
      const { dateString, level, message, title } = entries[i];
      alerts.push(<Alert level={level} title={`${title} * ${dateString}`} message={message} key={i} />);
    }
    return alerts;
  };

  render() {
    const { visible } = this.state;
    return <S.Wrapper $display={visible}>{this.renderAlerts()}</S.Wrapper>;
  }
}
export default connect(mapStateToProps, null)(AlertDisplay);
