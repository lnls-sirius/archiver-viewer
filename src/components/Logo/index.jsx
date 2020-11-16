import React from "react";

import * as S from "./styled";
import labLogo1 from "../../img/labLogo1.png";
import labLogo2 from "../../img/labLogo2.png";

function Logo(props) {
  return (
    <S.LogoWrapper>
      <S.ImageWrapper src={labLogo1} />
      <S.ImageWrapper src={labLogo2} />
    </S.LogoWrapper>
  );
}

export default Logo;
