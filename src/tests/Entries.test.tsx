import React from 'react';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { Provider } from "react-redux";
import Controls from '../components/Controls';
import store from '../store';

function element_present(text: string){
    const element = screen.getByText(text)
    expect(element).toBeInTheDocument()
}

describe('Controls Component', () => {
    it("Component renders", () => {
        act(() => {
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );
        })
    })
})
