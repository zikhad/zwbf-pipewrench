import { mock } from "jest-mock-extended";
import { ZWBFUI } from "./ZWBFUI";
import * as Events from "@asledgehammer/pipewrench-events";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { lactation, pregnancy, womb } from "../ZWBF";
import { Lactation } from "./Lactation";
import { Womb } from "./Womb";
import { PregnancyData } from "@types";
import { Pregnancy } from "./Pregnancy";

jest.mock("@client/components/UI/ZWBFTabManager", () => ({
  ZWBFTabManager: class {
        constructor() {}
        addTab() {}
    }
}));

describe("ZWBFUI", () => {
    const addButton = jest.fn();
    
    beforeEach(() => {
        const defaultNewUI = NewUI();
        addButton.mockClear();

        Object.defineProperty(global, "NewUI", {
            writable: true,
            value: () => ({
                ...defaultNewUI,
                addButton,
                "lactation-image": {
                    setVisible: jest.fn(),
                    setPath: jest.fn(),
                },
                "lactation-level-title": {
                    setVisible: jest.fn(),
                },
                "lactation-level-image": {
                    setVisible: jest.fn(),
                    setPath: jest.fn(),
                },
                "womb-sperm-current-amount": {
                    setText: jest.fn(),
                },
                "womb-sperm-total-amount": {
                    setText: jest.fn(),
                },
                "womb-image": {
                    setPath: jest.fn(),
                },
                "womb-cycle-phase-value": {
                    setText: jest.fn(),
                },
                "womb-fertility-title": {
                    setText: jest.fn(),
                },
                "womb-fertility-bar": {
                    setValue: jest.fn(),
                },
                "womb-fertility-value": {
                    setText: jest.fn(),
                },
            })
        });
    });
    describe("Event System", () => {
        const addListener = jest.fn();
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
            const [callback] = addListener.mock.calls[addListener.mock.calls.length - 1];
            
            callback();
            expect(spy).toHaveBeenCalled();
        })
    });
    describe("createUI", () => {
        let ui: ZWBFUI;
        beforeEach(() => {
            ui = new ZWBFUI({
                lactation: mock(),
                pregnancy: mock(),
                womb: mock()
            });
        });
        it.each([
            { trait: true, female: true },
            { trait: false, female: true },
            { trait: true, female: false },
            { trait: false, female: false },
        ])("should createUI properly when player is female: $female and INFERTILE trait: $trait", ({ trait, female }) => {

            const isFemale = jest.fn().mockReturnValue(female);
            const HasTrait = jest.fn().mockReturnValue(trait);
            const player = mock<IsoPlayer>({
                isFemale,
                HasTrait
            });
            
            ui.onCreatePlayer(player);
            ui.onCreateUI();
            expect(isFemale).toHaveBeenCalled();
            female && expect(HasTrait).toHaveBeenCalled();
        });

        it("Should call toggleLactationPanel properly", () => {
            const player = mock<IsoPlayer>({
                isFemale: () => true,
                HasTrait: () => false
            });
            ui.onCreatePlayer(player);
            ui.onCreateUI();
            const [, , callback] = addButton.mock.calls[0];
            expect((ui as any).activePanels.lactation).toBe(true);
            callback();
            expect((ui as any).activePanels.lactation).toBe(false);
            callback();
            expect((ui as any).activePanels.lactation).toBe(true);
        });
    });
    describe("onUpdateUI", () => {
        it.each([
            { uiVisible: false, female: false },
            { uiVisible: true, female: false },
            { uiVisible: false, female: true },
        ])("should do nothing if UI: $uiVisible and player is female: $female", ({uiVisible, female}) => {
            const ui = new ZWBFUI({
                lactation: mock(),
                pregnancy: mock(),
                womb: mock()
            });
            const isFemale = jest.fn().mockReturnValue(female);
            const HasTrait = jest.fn().mockReturnValue(false);
            const player = mock<IsoPlayer>({
                isFemale,
                HasTrait
            });
            
            ui.onCreatePlayer(player);
            ui.onCreateUI();
            // clear mock since onCreate can call the HasTrait as well
            HasTrait.mockClear();
            ui.onUpdateUI();

            (ui as any).UI && ((ui as any).UI.isUIVisible = uiVisible);
            expect(HasTrait).not.toHaveBeenCalled();
        });
        it.each([
            { pregnancy: null },
            { pregnancy: { progress: 0.5 } as PregnancyData },
        ])
        ("Should update UI when pregancy is $pregnancy", ({ pregnancy }) => {
            const HasTrait = jest.fn().mockReturnValue(false);
            const player = mock<IsoPlayer>({
                HasTrait,
                isFemale: () => true
            });

            const ui = new ZWBFUI({
                lactation: mock<Lactation>({
                    images: {
                        breasts: "breasts.png",
                        level: "level.png",
                    }
                }),
                pregnancy: mock<Pregnancy>({ pregnancy }),
                womb: mock<Womb>({
                    image: "womb.png",
                    phaseTranslation: "mock-phase",
                    fertility: 0.75,
                    amount: 200,
                    total: 400
                })
            });

            ui.onCreatePlayer(player);
            ui.onCreateUI();
            (ui as any).UI.isUIVisible = true;
            (ui as any).pregancy = { pregnancy };
            ui.onUpdateUI();
            expect(HasTrait).toHaveBeenCalled();
        });
    });
});