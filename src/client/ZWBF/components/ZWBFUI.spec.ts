import { mock } from "jest-mock-extended";
import { ZWBFUI } from "./ZWBFUI";
import * as Events from "@asledgehammer/pipewrench-events";

jest.mock("@client/components/UI/ZWBFTabManager", () => ({
  ZWBFTabManager: class {
        constructor() {}
    }
}));

describe("ZWBFUI", () => {
    const addListener = jest.fn();

    const ui = new ZWBFUI({
        lactation: mock(),
        pregnancy:mock(),
        womb: mock()
    });
    beforeEach(() => {
        addListener.mockClear();
        (Events as any).onCreateUI = { addListener };
        (Events as any).onPostRender = { addListener };
        (Events as any).onCreatePlayer = { addListener };
    });
    describe("Event System", () => {
        it.each(
            [
                { event: "onCreateUI", handler: "onCreateUI" },
                { event: "onPostRender", handler: "onUpdateUI" },
                { event: "onCreatePlayer", handler: "onCreatePlayer" }
            ]
        )("Should register & call $event callback properly", ({event, handler}) => {
            (Events as any)[event] = { addListener };

            const ui = new ZWBFUI({
                lactation: mock(),
                pregnancy: mock(),
                womb: mock()
            });

            (ui as any)[handler] = jest.fn();
            const spy = jest.spyOn(ui as any, handler);

            expect(addListener).toHaveBeenCalled();
            const [callback] = addListener.mock.calls[0];
            
            callback();
            expect(spy).toHaveBeenCalled();
        })
    });
    it("should work", () => {
        expect(ui).toBeDefined();
    });
});