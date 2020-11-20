import styled, { css } from "styled-components";
import { EyeSlashFill } from "@styled-icons/bootstrap/EyeSlashFill";
import { EyeFill } from "@styled-icons/bootstrap/EyeFill";

const BaseIndicator = css`
  width: 15px;
  height: 15px;
  color: white;
  margin: 3px;
`;
export const VisibleIndicator = styled(EyeFill)`
  ${BaseIndicator}
`;
export const HiddenIndicator = styled(EyeSlashFill)`
  ${BaseIndicator}
`;

export const EntriesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 25px;

  @media (max-width: 1920px) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 1600px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 1440px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 800px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

export const EntryGroup = styled.div`
  display: flex;
  align-items: center;
  background-color: #dbdbdb;
  margin: 0.125rem 0.25rem;
  justify-content: space-between;
`;
export const Color = styled.span`
  cursor: pointer;
  display: inline-block;
  min-height: 2rem;
  min-width: 2rem;
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
  margin: 0 7px;
  padding: 0.2rem 0.4rem;
  height: 90%;
  transition: color 0.5s;
  color: red;
  transition: background-color 0.5s;

  &:hover {
    color: white;
    background-color: #ff4343;
  }
`;
