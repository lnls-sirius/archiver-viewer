import styled from "styled-components";

export const LineChartWrapper = styled.div`
  height: 70vh;
`;

export const ZoomBox = styled.span.attrs((props) => ({
  style: {
    height: props.$height,
    width: props.$width,
    left: props.$left,
    top: props.$top,
  },
}))`
  display: ${(props) => (props.$visible ? "block" : "none")};
  position: absolute;
  background: lightblue;
  border-color: blue;
  border-width: 1px;
  border-style: solid;
  opacity: 0.3;
  pointer-events: none;
`;
