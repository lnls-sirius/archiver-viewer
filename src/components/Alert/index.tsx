import React, { useState, useEffect } from "react";

import { MessageLevel } from "../../utility/consts/MessageLevel";
import * as S from "./styled";

interface AlertProps {
  level: MessageLevel;
  message: string;
  title: string;
  extra: string;
}

const LIFETIME = 3000;
const Alert: React.FC<AlertProps> = ({ level, message, title, extra }) => {
  const [opacity, setOpacity] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setOpacity(1);
    setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setVisible(false);
      }, 500);
    }, LIFETIME);
  }, []);

  return visible ? (
    <S.Wrapper level={level} opacity={opacity} data-testid='wrapper'>
      <S.Title>
        {title}<br/>
        <S.Extra>{extra}</S.Extra>
      </S.Title>
      <S.Message>{message}</S.Message>
    </S.Wrapper>
  ) : null;
};
export default Alert;
