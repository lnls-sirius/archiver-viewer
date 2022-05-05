import styled from "styled-components";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const ControlsWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;
export const ControlsGroupWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;
export const DatePickerWrapper = styled(DatePicker)`
  height: 1.75rem;
  width: 8rem;
`;
interface ControlIconProps {
  $isActive?: boolean;
}
export const ControlIcon = styled(FontAwesomeIcon)<ControlIconProps>`
  margin: 0.4rem 0.5rem;
  display: inline-block;
  color: ${({ $isActive }) => ($isActive !== undefined && $isActive ? "grey" : "black")};
  transition: color 0.2s;

  background-position: center;
  transition: background 0.8s;

  &:active {
    color: lightgrey;
    transition: background 0s;
  }

  &:hover {
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
    color: ${({ $isActive }) => ($isActive !== undefined && $isActive ? "lightgrey" : "lightblue")};
  }
`;

export const ControlSelect = styled.select`
  margin-left: 0.1rem;
  margin-right: 0.4rem;
  height: 1.75rem;
`;
export const TimeDisplay = styled.span`
  margin: 0 15px 0 15px;
`;
export const TimeDisplayDate = styled.span`
  margin: 0 5px 0 5px;
  font-weight: 500;
`;
export const TimeDisplayText = styled.span`
  font-weight: 300;
`;
