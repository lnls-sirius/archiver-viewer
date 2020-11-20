import styled from "styled-components";

export const FooterWrapper = styled.footer`
  align-items: center;
  bottom: 0;
 // box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: flex-end;
  left: 0;
  //position: fixed;
  //width: 100vw;

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
