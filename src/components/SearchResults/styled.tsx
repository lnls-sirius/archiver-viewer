import styled from "styled-components";
export const Controls = styled.div`
  background-color: white;
  display: flex;
  height: 40px;
  justify-content: space-between;
  position: sticky;
  top: 0;
  width: 100%;
`;

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
export const ControlsLeft = styled.div`
  ${Button} {
    margin-left: 0.2rem;
  }

  > :nth-child(1) {
    margin: 0;
  }
`;
export const TableWrapper = styled.div`
  height: calc(100% - 60px);
  overflow: auto;
`;
export const Table = styled.table`
  width: 100%;
  white-space: nowrap;
  text-align: center;
`;

export const TableRow = styled.tr``;
export const TableData = styled.td``;

export const TableHeader = styled.th`
  background-color: darkgray;
  font-size: 1.05rem;
  font-weight: 500;
  margin-bottom: 5px;
  position: sticky;
  top: 0;
`;

export const TableHead = styled.thead``;
export const TableBody = styled.tbody`
  ${TableData} {
    padding: 0.2rem 0.1rem;
  }
  ${TableRow} {
    &:hover {
      background-color: tomato;
    }
  }
`;
