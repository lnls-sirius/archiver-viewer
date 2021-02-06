import styled from "styled-components";

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  vertical-align: middle;
  padding: 0 0.6rem;
`;

export const Icon = styled.svg`
  fill: none;
  stroke: white;
  stroke-width: 2px;
`;

export const CheckboxInput = styled.input.attrs({ type: "checkbox" })`
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  //position: absolute;
  white-space: nowrap;
  width: 1px;
`;

interface ChecboxProps {
  checked: boolean;
}
export const CheckboxBox = styled.div<ChecboxProps>`
  display: inline-block;
  min-width: 16px;
  min-width: 16px;
  height: 16px;
  height: 16px;
  background: ${({ checked }) => (checked ? "blue" : "papayawhip")};
  border-radius: 3px;
  transition: all 150ms;
  cursor: pointer;

  &:hover {
    background: ${({ checked }) => (checked ? "darkblue" : "papayawhip")};
    box-shadow: 0 0 0 3px lightblue;
  }

  ${CheckboxInput}:focus + & {
    box-shadow: 0 0 0 3px lightblue;
  }

  ${Icon} {
    visibility: ${({ checked }) => (checked ? "visible" : "hidden")};
  }
`;

export const CheckboxTooltip = styled.span`
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;

  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
`;

export const CheckboxSpan = styled.span`
  border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
  cursor: default;
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0.2rem;
  position: relative;

  &:hover {
    ${CheckboxTooltip} {
      visibility: visible;
    }
  }
`;
