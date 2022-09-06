import styled from "styled-components";
import { MessageLevel } from "../../utility/consts/MessageLevel";

interface AlertWrapperProps {
  level: MessageLevel;
  opacity: number;
}

const getBGColorFromLevel = (level: MessageLevel) => {
  switch (level) {
    case MessageLevel.info:
      return "#46c4ffAA";
    case MessageLevel.error:
      return "#ff9e9eAA";
    case MessageLevel.warn:
      return "#feffaaAA";
    default:
      return "#a8a8a8AA";
  }
};

export const Wrapper = styled.div<AlertWrapperProps>`
  padding: 0.5rem 0.25rem;
  margin: 8px;
  background-color: ${({ level }) => getBGColorFromLevel(level)};
  transition: opacity 0.5s;
  opacity: ${({ opacity }) => opacity};
  border-radius: 0.5em;
`;
export const Title = styled.h1`
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;
export const Message = styled.p`
  font-size: 0.75rem;
  width: 40em;
`;
export const Extra = styled.span`
  padding: 5px;
  font-size: 0.80rem;
  font-weight: 400;
`;
