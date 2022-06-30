import styled from "styled-components";

export const IntervalsWarpper = styled.div`
  display: flex;
  justify-content: center;
  background-color: grey;
  flex-wrap: wrap;
  margin: 0.2rem 0.2rem;
  box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 2px 1px -1px rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.2);
`;

interface IntervalsItemProps {
  pushed: boolean;
}
export const IntervalsItem = styled.button<IntervalsItemProps>`
  padding: 0.4rem 0.65rem;
  text-align: center;
  color: ${({ pushed }) => (pushed ? "black" : "white")};
  background-color: ${({ pushed }) => (pushed ? "lightgrey" : "grey")};
  font-weight: ${({ pushed }) => (pushed ? 700 : 500)};

  transition: color 0.5s;

  font-size: 1.025rem;

  &:hover {
    color: #1f1f1f;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
  }
`;


export const IntervalWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: lightgrey;
  border-radius: 0.2rem;
  padding: 0rem 0.5rem;
  margin: 0.2rem 1rem;
  &:hover {
    background-color: darkgrey;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
  }
`;

export const IntervalInput = styled.input`
  text-align: center;
  background-color: grey;
  color: #ffffff;
  border-radius: 0.5rem;
  width: 3rem;
  margin: 0.2rem 0.2rem;
  -moz-appearance: textfield;
`

export const UnitInput = styled.select`
  text-align: center;
  background-color: grey;
  color: #ffffff;
  border-radius: 0.5rem;
  width: 3rem;
  margin: 0.2rem 0.2rem;
  -moz-appearance: textfield;
`

export const opt = styled.option`
  background-color: grey;
`
