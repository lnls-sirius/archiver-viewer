import styled from "styled-components";

export const FooterWrapper = styled.footer`
  align-items: center;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  left: 0;

  @media (max-width: 800px) {
    display: none;
  }
`;
export const FooterText = styled.p`
  display: inline-block;
  font-size: 1.1rem;
  font-weight: 300;
  margin: 2px 2px;
`;
export const FooterLink = styled.a``;
