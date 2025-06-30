import { mock } from "jest-mock-extended";
import { DebugMenu } from "./DebugMenu";

import * as SpyPipewrench from "@asledgehammer/pipewrench";
import {IsoPlayer} from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { PregnancyData } from "@types";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@asledgehammer/pipewrench/client");

describe("DebugMenu", () => {

    const createMocks = () => {
        const lactation = mock<Lactation>({
            bottleAmount: 200,
            Debug: {
                toggle: jest.fn(),
                add: jest.fn(),
                set: jest.fn(),
            }
        });
        const pregnancy = mock<Pregnancy>({
            // pregnancy: mock<PregnancyData>(),
            Debug: {
                start: jest.fn(),
                stop: jest.fn(),
                advance: jest.fn(),
                advanceToLabor: jest.fn(),
            }
        });
        const womb = mock<Womb>({
            Debug: {
                sperm: {
                    add: jest.fn(),
                    set: jest.fn(),
                    setTotal: jest.fn(),
                    remove: jest.fn(),
                },
                cycle: {
                    addDay: jest.fn(),
                    nextPhase: jest.fn(),
                }
            }
        });
        return {
            lactation,
            pregnancy,
            womb
        };
    }

    const mockSubmenu = {
        addOption: jest.fn().mockReturnValue({ tooltip: jest.fn() }),
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    Object.defineProperty(global, "ISContextMenu", {
        writable: true,
        value: {
            getNew: jest.fn().mockReturnValue(mockSubmenu)
        },
    });

    describe("Debug is disabled", () => {
        beforeEach(() => {
            jest.spyOn(SpyPipewrench, "isDebugEnabled").mockReturnValue(false);
        });
        it("should NOT create debug context menu", () => {
            const { lactation, pregnancy, womb } = createMocks();
            const instance = new DebugMenu({
                lactation,
                pregnancy,
                womb
            });
            expect(instance).toBeInstanceOf(DebugMenu);
            expect(Events.onFillWorldObjectContextMenu.addListener).not.toHaveBeenCalledTimes(1);
        });
    });
    describe("Debug is enabled", () => {
        beforeEach(() => {
            jest.spyOn(SpyPipewrench, "isDebugEnabled").mockReturnValue(true);
        });
        it("Should NOT create a debug context menu when player is NOT female", () => {
            jest.spyOn(SpyPipewrench, "getSpecificPlayer").mockImplementation(() => mock<IsoPlayer>({
                isFemale: () => false
            }));
            const { lactation, pregnancy, womb } = createMocks();
            const instance = new DebugMenu({
                lactation,
                pregnancy,
                womb
            });
            const [addListener] = (Events.onFillWorldObjectContextMenu.addListener as jest.Mock).mock.calls[0];
            addListener(1, mock());

            const spy = jest.spyOn(instance as any, "addOption");
            expect(spy).not.toHaveBeenCalled();
        });
        describe("addOption", () => {
            
            const { lactation, pregnancy, womb } = createMocks();
            beforeEach(() => {
                jest.spyOn(SpyPipewrench, "getSpecificPlayer").mockImplementation(() => mock<IsoPlayer>({
                    isFemale: () => true
                }));
            });
            it("should create a debug context menu", () => {
                new DebugMenu({
                    lactation,
                    pregnancy,
                    womb
                });
                const [addListener] = (Events.onFillWorldObjectContextMenu.addListener as jest.Mock).mock.calls[0];
                addListener(1, mock());
                expect(Events.onFillWorldObjectContextMenu.addListener).toHaveBeenCalledTimes(1);
            });
            it.each([
                {
                    title: "Add_Sperm",
                    expected: () => expect(womb.Debug.sperm.add).toHaveBeenCalledWith(100)
                },
                {
                    title: "Remove_Sperm",
                    expected: () => expect(womb.Debug.sperm.set).toHaveBeenCalledWith(0)
                },
                {
                    title: "Reset_Sperm",
                    expected: () => expect(womb.Debug.sperm.setTotal).toHaveBeenCalledWith(0)
                },
                {
                    title: "Add_Cycle_Day",
                    mockCondition: () => (pregnancy as any).pregnancy = null,
                    expected: () => expect(womb.Debug.cycle.addDay).toHaveBeenCalled()
                },
                {
                    title: "Next_Cycle",
                    expected: () => expect(womb.Debug.cycle.nextPhase).toHaveBeenCalled()
                },
                {
                    title: "Milk_Toggle",
                    expected: () => expect(lactation.Debug.toggle).toHaveBeenCalled()
                },
                {
                    title: "Milk_Add_Milk",
                    expected: () => expect(lactation.Debug.add).toHaveBeenCalledWith(200)
                },
                {
                    title: "Milk_Clear_Milk",
                    expected: () => expect(lactation.Debug.set).toHaveBeenCalledWith(0)
                },
                {
                    title: "Add_Pregnancy",
                    mockCondition: () => (pregnancy as any).pregnancy = null,
                    expected: () => expect(pregnancy.Debug.start).toHaveBeenCalled()
                },
                {
                    title: "Remove_Pregnancy",
                    mockCondition: () => (pregnancy as any).pregnancy = mock(),
                    expected: () => expect(pregnancy.Debug.stop).toHaveBeenCalled()
                },
                {
                    title: "Advance_Pregnancy",
                    mockCondition: () => (pregnancy as any).pregnancy = mock(),
                    expected: () => expect(pregnancy.Debug.advance).toHaveBeenCalled()
                },
                {
                    title: "Advance_Pregnancy_Labor",
                    mockCondition: () => (pregnancy as any).pregnancy = mock(),
                    expected: () => expect(pregnancy.Debug.advanceToLabor).toHaveBeenCalled()
                }
            ])("option $title should trigger correct", ({title, mockCondition, expected}) => {
                mockCondition && mockCondition();
                new DebugMenu({
                    lactation,
                    pregnancy,
                    womb
                });
                const [addListener] = (Events.onFillWorldObjectContextMenu.addListener as jest.Mock).mock.calls[0];
                addListener(1, mock());
                const addOptions = mockSubmenu.addOption.mock.calls;
                const menuCall = addOptions.find(([call]) => (call as string).includes(title)) || [];
                const [,, action] = menuCall;
                action();
                expected();
            });
        });
    });
});