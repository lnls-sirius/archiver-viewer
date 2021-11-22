import styled from "styled-components";

interface ModalWrapperProps {
  $opacity: number;
}
export const ModalBG = styled.div<ModalWrapperProps>`
  opacity: ${({ $opacity }) => $opacity};
  transition: 0.25s;
  height: 100%;
  width: 100%;

  background: rgba(128, 128, 128, 0.3);
  border: none;
  left: 0;
  top: 0;
  position: absolute;
  z-index: 2;
`;

export const ModalWrapper = styled.div`
  height: 80%;
  width: 80%;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.2);
  padding: 0.2rem 0.8rem;
  left: 10%;
  top: 10%;
  z-index: 3;
  position: absolute;
`;
