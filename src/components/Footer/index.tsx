import React from "react";
import * as S from "./styled";

const version = "2026-03-27-323cefc";

const Footer: React.FC = () => {
  return (
    <S.FooterWrapper>
      <S.FooterText>
        Version: <span style={{ fontWeight: 500, padding: "5px" }}>{version}</span>
      </S.FooterText>
    </S.FooterWrapper>
  );
};
export default Footer;
