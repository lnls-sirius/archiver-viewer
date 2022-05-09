import React from "react";
import * as S from "./styled";

const version = "2022-05-09-3278f7c";

const Footer: React.FC = () => {
  return (
    <S.FooterWrapper>
      <S.FooterText>
        For further information, refer to the &nbsp;
        <S.FooterLink href="https://github.com/lnls-sirius/archiver-viewer" target="_blank">
          project&apos;s official website
        </S.FooterLink>
        &nbsp;or contact GAS. <span style={{ fontWeight: 500, padding: "5px" }}>{version}</span>
      </S.FooterText>
    </S.FooterWrapper>
  );
};
export default Footer;
