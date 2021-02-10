import React from "react";
import * as S from "./styled";
import { connect } from "react-redux";

import Alert from "../Alert";
import { RootState } from "../../reducers";
import { Entry } from "../../features/status";

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
  private MAX_ALERTS = 1;

  constructor(props: AlertProps | Readonly<AlertProps>) {
    super(props);
    this.state = { visible: true };
  }

  renderAlerts = (): JSX.Element[] => {
    const { entries } = this.props;
    const alerts: JSX.Element[] = [];
    for (let i = entries.length - 1, counter = 0; i >= 0; i--, counter++) {
      if (counter > this.MAX_ALERTS) {
        break;
      }
      const { dateString, level, message, title, id } = entries[i];
      alerts.push(<Alert level={level} title={`${title}`} message={message} key={id} extra={`${dateString}`} />);
    }
    return alerts;
  };

  render() {
    const { visible } = this.state;
    return <S.Wrapper $display={visible}>{this.renderAlerts()}</S.Wrapper>;
  }
}
export default connect(mapStateToProps, null)(AlertDisplay);
