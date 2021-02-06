import React from "react";
import * as S from "./styled";

interface ModalProps {
  visible: boolean;
}
// eslint-disable-next-line react/prop-types
const Modal: React.FC<ModalProps> = ({ visible, children }) => {
  return <S.ModalWrapper $visible={visible}>{children}</S.ModalWrapper>;
};

export default Modal;
