import React from "react";
import * as S from "./styled";

interface CheckboxProps {
  checked: boolean;
  text?: string;
  tooltip?: string;
  onClick(e: React.MouseEvent): any;
}

// eslint-disable-next-line react/prop-types
const Checkbox: React.FC<CheckboxProps> = ({ checked, text, tooltip, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    onClick(e);
  };
  return (
    <S.CheckboxWrapper>
      <S.CheckboxBox checked={checked} onClick={handleClick}>
        <S.Icon viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </S.Icon>
      </S.CheckboxBox>
      <S.CheckboxSpan>
        {text}
        <S.CheckboxTooltip>{tooltip ? tooltip : ""}</S.CheckboxTooltip>
      </S.CheckboxSpan>
    </S.CheckboxWrapper>
  );
};
export default Checkbox;
