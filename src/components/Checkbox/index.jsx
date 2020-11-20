import React from "react";
import * as S from "./styled";

const Checkbox = ({ checked, text, tooltip, onClick, ...props }) => {
  const handleClick = (e) => {
    e.target.checked = !checked;
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
