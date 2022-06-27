import styled from "styled-components";
interface ButtonStyleProps {
  $bgH?: string;
  $fgH?: string;
  $bg?: string;
  $fg?: string;
}
export const Button = styled.button<ButtonStyleProps>`
  background-color: ${(props) => (props.$bg ? props.$bg : "gray")};
  border-radius: 2px;
  color: ${(props) => (props.$fg ? props.$fg : "white")};
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  height: 36px;
  transition: 0.2s;
  &:hover {
    background-color: ${(props) => (props.$bgH ? props.$bgH : "lightgray")};
    color: ${(props) => (props.$fgH ? props.$fgH : "black")};
  }
`;

export const Controls = styled.div`
  background-color: white;
  display: flex;
  height: 40px;
  justify-content: space-between;
  position: sticky;
  align-items: center;
  top: 0;
  width: 100%;
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  width: 100%;
  align-items: center;
`;

export const Title = styled.div`
  width: 100%;
  font-size: 1.5rem;
  font-weight: 900;
  text-align: center;
`;

export const Item = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 10 0rem;
  padding: 10px;
  background-color: lightgray;
  border-radius: 15rem;
  &:hover {
    background-color: gray;
  }
`

export const ItemHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 10 0rem;
  padding: 10px;
  background-color: darkgray;
  font-weight: 700;
  border-radius: 15rem;
`

export const ItemData = styled.span`
  width: 30rem;
  text-align: center;
`
