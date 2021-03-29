import styled from "styled-components";
export const InputWarpper = styled.div`
  display: flex;
  flex-direction: column;
`;
interface InputProps {
  $visible: boolean;
}
export const Input = styled.input<InputProps>`
  display: ${({ $visible }) => ($visible ? "inline-block" : "none")};
  width: 80px;
  margin: 2px;
`;
export const SeriesWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 15px 25px;

  @media (max-width: 1920px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 1440px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 980px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

export const SerieWrapper = styled.div`
  align-items: center;
  background-color: #dbdbdb;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  margin: 0.125rem 0.25rem;
  padding: 0.2rem 0.4rem;
`;
export const SerieName = styled.p`
  font-weight: 500;
  margin-left: 0.2rem;
`;

export const Button = styled.button``;
