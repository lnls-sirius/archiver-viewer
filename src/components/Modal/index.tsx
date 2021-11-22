import React, { useState, useEffect } from "react";
import * as S from "./styled";

interface ModalProps {
  visible: boolean;
  bgOnClick?: () => void;
}
// eslint-disable-next-line react/prop-types
const Modal: React.FC<ModalProps> = ({ visible, children, bgOnClick }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(visible ? 1 : 0);
  }, [visible]);

  return (
    <S.ModalBG $opacity={opacity} onClick={() => (bgOnClick ? bgOnClick() : null)}>
      <S.ModalWrapper
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {children}
      </S.ModalWrapper>
    </S.ModalBG>
  );
};

export default Modal;
