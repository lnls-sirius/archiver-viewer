import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, act, render, screen, fireEvent } from '@testing-library/react';
import Checkbox from '../components/Checkbox';

function element_present(text: string){
    const element = screen.getByText(text)
    expect(element).toBeInTheDocument()
}

describe('Checkbox Component', () => {
    jest.useFakeTimers();

    it("Component renders", () => {
        act(() => {
            const text = 'Checkbox text'
            const tooltip = 'Checkbox tooltip'
            let variable: boolean = false;

            render(
                <Checkbox
                    text={text}
                    tooltip={tooltip}
                    checked={variable}
                    onClick={() => null}
                />
            );

            element_present(text)

            const element = screen.getByTestId("checkbox")
            expect(element).toBeInTheDocument()
        });
    })

    it("Checked works", () => {
        act(() => {
            const text = 'Checkbox text'
            const tooltip = 'Checkbox tooltip'


            render(
                <Checkbox
                    text={text}
                    tooltip={tooltip}
                    checked={false}
                    onClick={() => null}
                />
            );

            const element_off = screen.getByTestId("checkbox")
            expect(element_off).toHaveStyle("background: papayawhip")

            cleanup()
            render(
                <Checkbox
                    text={'Checkbox text 2'}
                    tooltip={tooltip}
                    checked={true}
                    onClick={() => null}
                />
            );

            const element_on = screen.getByTestId("checkbox")
            expect(element_on).toHaveStyle("background: darkblue")
        });
    })

    it("Click Checkbox", () => {
        act(() => {
            const text = 'Checkbox text'
            const tooltip = 'Checkbox tooltip'
            let variable = false

            function click_function(){
                variable = true;
            }

            render(
                <Checkbox
                    text={text}
                    tooltip={tooltip}
                    checked={variable}
                    onClick={click_function}
                />
            );

            const click_elem = screen.getByTestId("checkbox")
            fireEvent.click(click_elem)
            expect(variable).toBe(true);
        });
    })

    it("Hover checkbox", () => {
        act(() => {
            const text = 'Checkbox text'
            const tooltip = 'Checkbox tooltip'
            let variable = false

            render(
                <Checkbox
                    text={text}
                    tooltip={tooltip}
                    checked={variable}
                    onClick={()=>null}
                />
            );

            const cb_test = screen.getByTestId("cb-test")
            fireEvent.mouseOver(cb_test)
            element_present(tooltip)
        });
    })
})
