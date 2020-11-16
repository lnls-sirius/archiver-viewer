import React from "react";
import * as S from "./styled";
const Footer = () => {
  return (
    <S.FooterWrapper>
      <S.FooterText>
        For further information, refer to the &nbsp;
        <S.FooterLink href="https://github.com/lnls-sirius/archiver-viewer/tree/devel" target="_blank">
          project's official website
        </S.FooterLink>
        &nbsp; or send an email to claudio.carneiro@cnpem.br or eduardo.coelho@cnpem.br.
      </S.FooterText>
    </S.FooterWrapper>
  );
};
export default Footer;
