import styled from "styled-components";

export const EntriesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  margin: 0 25px;
`;

export const EntryGroup = styled.div`
  display: flex;
  align-items: center;
  background-color: #dbdbdb;
  margin: 0.2rem 1.2rem;
`;

export const Color = styled.span`
  cursor: pointer;
  display: inline-block;
  height: 2rem;
  width: 2rem;
  background-color: ${(props) => props.$bgcolor};
`;

export const Text = styled.p`
  font-weight: 400;
  margin: 0.2rem;
  font-size: 0.8rem;
`;

export const EguText = styled.p`
  font-weight: 600;
  font-size: 0.75rem;
`;

export const Button = styled.button`
  margin: 2px;
  height: 80%;
  transition: color 0.5s;
  color: red;
  transition: background-color 0.5s;

  &:hover {
    color: white;
    background-color: #ff4343;
  }
`;
