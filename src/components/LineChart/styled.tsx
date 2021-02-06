import styled from "styled-components";

export const LineChartWrapper = styled.div`
  height: 70vh;
`;

interface ZoomBoxProps {
  $height: number;
  $width: number;
  $left: number;
  $top: number;
  $visible: boolean;
}

export const ZoomBox = styled.span.attrs<ZoomBoxProps>(({ $height, $left, $top, $width }) => ({
  style: {
    height: $height,
    width: $width,
    left: $left,
    top: $top,
  },
}))<ZoomBoxProps>`
  display: ${({ $visible }) => ($visible ? "block" : "none")};
  position: absolute;
  background: lightblue;
  border-color: blue;
  border-width: 1px;
  border-style: solid;
  opacity: 0.3;
  pointer-events: none;
`;
