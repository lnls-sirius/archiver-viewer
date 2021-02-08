import styled from "styled-components";
interface WarpperProps {
  $display: boolean;
}
export const Wrapper = styled.div<WarpperProps>`
  border-width: 1px;
  display: ${({ $display }) => ($display ? "block" : "none")};
  margin-left: auto;
  margin-right: auto;
  right: 0;
  left: 0;
  top: 80%;
  text-align: center;
  z-index: 5;
`;
