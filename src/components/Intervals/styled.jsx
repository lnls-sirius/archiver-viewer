import styled from "styled-components";

export const IntervalsWarpper = styled.div`
  display: flex;
  justify-content: center;
  background-color: grey;
  flex-wrap: wrap;
  margin: 0.2rem 0.2rem;
  box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 2px 1px -1px rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.2);
`;

export const IntervalsItem = styled.button`
  padding: 0.4rem 0.65rem;
  text-align: center;
  color: ${(props) => (props.pushed ? "black" : "white")};
  background-color: ${(props) => (props.pushed ? "lightgrey" : "grey")};
  font-weight: ${(props) => (props.pushed ? 700 : 500)};

  transition: color 0.5s;

  font-size: 1.025rem;

  &:hover {
    color: #1f1f1f;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
  }
`;
