import React from 'react';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import AlertDisplay from '../components/AlertDisplay';
import { MessageLevel } from '../utility/consts/MessageLevel';
import { Provider } from "react-redux";
import { actions } from '../features/status';
import store from '../store';

function element_present(text: string){
    const element = screen.getByText(text)
    expect(element).toBeInTheDocument()
}

describe('Alert Component', () => {
    it("Component renders", () => {
        act(() => {
            const title = [
                'Alert Title', 'Alert Title2']
            const message = [
                'Alert Message', 'Alert Message2']
            const now: Date = new Date()

            store.dispatch(actions.addEntry({
                message: message[0],
                title: title[0],
                level: MessageLevel.error,
                time: now
            }));
            store.dispatch(actions.addEntry({
                message: message[1],
                title: title[1],
                level: MessageLevel.debug,
                time: new Date(0)
            }));

            render(
                <Provider store={store}>
                    <AlertDisplay/>
                </Provider>
            );

            element_present(message[0]);
            element_present(message[1]);

            element_present(title[0]);
            element_present(title[1]);

            element_present(now.toString());
        });
    })

})
