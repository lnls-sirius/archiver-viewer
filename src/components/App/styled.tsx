import styled from "styled-components";

export const AppLayout = styled.div``;
export const HeaderWrapper = styled.header`
  margin-bottom: 1.6rem;
  display: grid;
  grid-template-columns: 180px 1fr;
  box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.2);

  & > :nth-child(1) {
    grid-row: 1/3;
    justify-self: center;
  }

  @media (max-width: 950px) {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    & > :nth-child(1) {
      display: none;
    }
  }
`;

export const FooterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 25px;
`;
