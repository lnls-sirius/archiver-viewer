import styled from "styled-components";
import { MessageLevel } from "../../utility/consts/MessageLevel";

interface AlertWrapperProps {
  level: MessageLevel;
  opacity: number;
}

const getBGColorFromLevel = (level: MessageLevel) => {
  switch (level) {
    case MessageLevel.info:
      return "lightblue";
    case MessageLevel.error:
      return "#ff9e9e";
    case MessageLevel.warn:
      return "#feffaa";
    default:
      return "lightgrey";
  }
};

export const Wrapper = styled.div<AlertWrapperProps>`
  padding: 0.5rem 0.25rem;
  margin: 8px;
  background-color: ${({ level }) => getBGColorFromLevel(level)};
  transition: opacity 0.5s;
  opacity: ${({ opacity }) => opacity};
`;
export const Title = styled.h1`
  font-size: 1.05rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;
export const Message = styled.p`
  font-size: 0.95rem;
`;
