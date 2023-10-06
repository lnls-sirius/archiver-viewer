import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from "react-redux";
import Controls from '../components/Controls';
import store from '../store';
import control from '../entities/Chart';
import handlers from "../controllers/handlers";

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

            element_present("from")
            element_present("to")
            element_present("Diff Time:")
            element_present("End")
            element_present("Start")
            element_present("Backward")
            element_present("Forward")
            element_present("Now")
            element_present("Undo action")
            element_present("Redo action")
            element_present("Auto scroll")
            element_present("Zoom")
            element_present("Export as xlsx")
            element_present("Shortcuts information")
            element_present("Show all in tooltip")

            let element = screen.getByPlaceholderText("Search ...")
            expect(element).toBeInTheDocument()

            element = screen.getByTitle("Diff timestamp")
            expect(element).toBeInTheDocument()

            element = screen.getByTitle("Start/end timestamp")
            expect(element).toBeInTheDocument()
        })
    })

    it("Set Diff time", async () => {
        await act( async () => {
            await control.setRefDiff(
                new Date("10/3/2023, 5:09:23 PM"));
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );

            const element = screen.getByTitle("Diff timestamp") as HTMLInputElement
            expect(element.value).toBe("03/10/23 17:09:23")
        })
    })

    it("Set Start time", async () => {
        await act( async () => {
            handlers.updateReferenceTime(false);
            await handlers.onChangeDateHandler(
                new Date("10/2/2023, 10:09:23 AM"));
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );

            const select_ref = screen.getByTestId("select") as HTMLSelectElement
            fireEvent.change(select_ref, {target: {value: 0}})

            const element_sp = screen.getByTitle("Start/end timestamp") as HTMLInputElement
            expect(element_sp.value).toBe("02/10/23 10:09:23")

            const element_rb = screen.getByText("02/10/2023, 10:09:23")
            expect(element_rb).toBeInTheDocument()
        })
    })

    it("Set End time", async () => {
        await act( async () => {
            handlers.updateReferenceTime(true);
            await handlers.onChangeDateHandler(
                new Date("10/2/2023, 11:09:23 AM"));
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );

            const element_sp = screen.getByTitle("Start/end timestamp") as HTMLInputElement
            expect(element_sp.value).toBe("02/10/23 11:09:23")

            const element_rb = screen.getByText("02/10/2023, 11:09:23")
            expect(element_rb).toBeInTheDocument()
        })
    })

    it("Backward button", async () => {
        await act( async () => {
            handlers.updateReferenceTime(false);
            await handlers.onChangeDateHandler(
                new Date("10/2/2023, 11:09:23 AM"));
            await handlers.backTimeWindow()
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );

            const start_rb = screen.getByText("02/10/2023, 10:59:23")
            expect(start_rb).toBeInTheDocument()

            const end_rb = screen.getByText("02/10/2023, 11:09:23")
            expect(end_rb).toBeInTheDocument()
        })
    })

    it("Forward button", async () => {
        await act( async () => {
            handlers.updateReferenceTime(false);
            await handlers.onChangeDateHandler(
                new Date("10/2/2023, 11:09:23 AM"));
            await handlers.forwTimeWindow();
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );

            const start_rb = screen.getByText("02/10/2023, 11:19:23")
            expect(start_rb).toBeInTheDocument()

            const end_rb = screen.getByText("02/10/2023, 11:29:23")
            expect(end_rb).toBeInTheDocument()
        })
    })

    it("Now button", async () => {
        await act( async () => {
            const now = (new Date()).toLocaleString('pt-BR');
            await handlers.updateEndNow();
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );
            const start_rb = screen.getByText(now)
            expect(start_rb).toBeInTheDocument()
        })
    })

    it("Auto Update button", async () => {
        await act( async () => {
            const now = (new Date()).toLocaleString('pt-BR');
            render(
                <Provider store={store}>
                    <Controls/>
                </Provider>
            );

            await handlers.autoUpdateHandler();
            if(control.isAutoUpdateEnabled()){
                await handlers.autoUpdateHandler();
                expect(control.isAutoUpdateEnabled()).toBeFalsy()
            }else{
                await handlers.autoUpdateHandler();
                expect(control.isAutoUpdateEnabled()).toBeTruthy()
            }
        })
    })
})
