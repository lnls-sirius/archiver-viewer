import styled from "styled-components";

export const ModalWrapper = styled.div`
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  // display: ${(props) => (props.$visible ? "block" : "none")};
  transition: 0.25s;
  height: 80%;
  width: 80%;

  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.2);
  padding: 0.2rem 0.8rem;
  left: 10%;
  position: absolute;
  z-index: 2;
`;
