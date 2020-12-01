import React, { useState } from "react";
import * as S from "./styled";

const Modal = ({ visible, children, ...props }) => {
  return <S.ModalWrapper $visible={visible}>{children}</S.ModalWrapper>;
};

export default Modal;
