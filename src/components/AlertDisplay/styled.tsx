import styled from "styled-components";
interface WarpperProps {
  $display: boolean;
}
export const Wrapper = styled.div<WarpperProps>`
  //bottom: 10%;//calc(100% - 100px);
  // border-color: black;
  // border-style: solid;
  border-width: 1px;
  display: ${({ $display }) => ($display ? "block" : "none")};
  margin-left: auto;
  margin-right: auto;
  position: absolute;
  right: 0;
  left: 0;
  top: 80%;
  text-align: center;
`;
