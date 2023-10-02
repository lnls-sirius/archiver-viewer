import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, act, render, screen } from '@testing-library/react';
import { MessageLevel } from '../utility/consts/MessageLevel';
import Alert from '../components/Alert';

function element_present(text: string){
    const element = screen.getByText(text)
    expect(element).toBeInTheDocument()
}

function element_not_present(text: string){
    const element = screen.queryByText(text)
    expect(element).not.toBeInTheDocument()
}

function element_bg_color(text: string, color: string){
    const element = screen.getByTestId(text)
    expect(element).toHaveStyle("background-color: " + color)
}

describe('Alert Component', () => {
    jest.useFakeTimers();

    it("Component renders", () => {
        act(() => {
            const title = 'Alert Title'
            const message = 'Alert Message'
            const extra = 'Extra string'

            render(
                <Alert
                    level={MessageLevel.debug}
                    title={title}
                    message={message}
                    key={0}
                    extra={extra}
                />
            );

            element_present(title)
            element_present(message)
            element_present(extra)
        });
    })

    it("Widget disappear", () => {
        act(() => {
            const title = 'Alert Title'
            const message = 'Alert Message'
            const extra = 'Extra string'

            render(
                <Alert
                    level={MessageLevel.debug}
                    title={title}
                    message={message}
                    key={0}
                    extra={extra}
                />
            );

            jest.runAllTimers();
            element_not_present(title)
            element_not_present(message)
            element_not_present(extra)
        });
    })

    it("Background color Debug", () => {
        act(() => {
            const title = 'Alert Title'
            const message = 'Alert Message'
            const extra = 'Extra string'

            const bg_color_test: {[key: string]: MessageLevel} = {
                "#a8a8a8AA": MessageLevel.debug,
                "#46c4ffAA": MessageLevel.info,
                "#feffaaAA": MessageLevel.warn,
                "#ff9e9eAA": MessageLevel.error
            }

            Object.entries(bg_color_test).map(([color, level]: [string, MessageLevel]) => {
                render(
                    <Alert
                        level={level}
                        title={title}
                        message={message}
                        key={0}
                        extra={extra}
                    />
                );
                console.log(color, level)
                element_bg_color("wrapper", color)
                cleanup()
            })
        });
    })
})
