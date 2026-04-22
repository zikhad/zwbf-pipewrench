/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { ContextMenu, Option } from "./ContextMenu";

import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { ZWBFEventsEnum } from "@constants";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@asledgehammer/pipewrench/client");

describe("DebugMenu", () => {
	const createMocks = () => {
		const lactation = mock<Lactation>({
			bottleAmount: 0.2,
			Debug: {
				toggle: jest.fn(),
				add: jest.fn(),
				set: jest.fn()
			}
		});
		const pregnancy = mock<Pregnancy>({
			Debug: {
				advance: jest.fn(),
				advanceToLabor: jest.fn()
			}
		});
		const womb = mock<Womb>({
			Debug: {
				sperm: {
					add: jest.fn(),
					set: jest.fn(),
					setTotal: jest.fn(),
					remove: jest.fn()
				},
				cycle: {
					addDay: jest.fn(),
					nextPhase: jest.fn()
				}
			}
		});

		const options = mock<Option[]>([
			{
				title: "mocked",
				description: "mocked",
				fn: jest.fn()
			}
		]);

		const context = mock<{
			addOption: () => { toolTip: string };
		}>({
			addOption: () => ({ toolTip: "toolTip" })
		});

		return {
			lactation,
			pregnancy,
			womb,
			options,
			context
		};
	};

	const mockSubmenu = {
		addOption: jest.fn().mockReturnValue({ toolTip: jest.fn() })
	};

	Object.defineProperty(global, "ISContextMenu", {
		writable: true,
		value: {
			getNew: jest.fn().mockReturnValue(mockSubmenu)
		}
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Debug is disabled", () => {
		const { lactation, pregnancy, womb, options } = createMocks();

		beforeEach(() => {
			jest.spyOn(SpyPipewrench, "isDebugEnabled").mockReturnValue(false);
		});

		it("should Only create One context menu item", () => {
			new ContextMenu({
				lactation,
				pregnancy,
				womb,
				options
			});
			expect(Events.onFillWorldObjectContextMenu.addListener).toHaveBeenCalledTimes(1);
		});
	});
	describe("Debug is enabled", () => {
		const { lactation, pregnancy, womb, options, context } = createMocks();

		beforeEach(() => {
			jest.spyOn(SpyPipewrench, "isDebugEnabled").mockReturnValue(true);
		});

		describe("Player is Male", () => {
			beforeEach(() => {
				jest.spyOn(SpyPipewrench, "getSpecificPlayer").mockImplementation(() =>
					mock<IsoPlayer>({
						isFemale: () => false
					})
				);
			});
			it("Should NOT create a context menu when player is Male", () => {
				const instance = new ContextMenu({
					lactation,
					pregnancy,
					womb,
					options
				});

				const [addListener] = (Events.onFillWorldObjectContextMenu.addListener as jest.Mock)
					.mock.calls[0];
				addListener(1, context);

				const spy = jest.spyOn(instance as any, "addOption");
				expect(spy).not.toHaveBeenCalled();
			});
		});

		describe("Player is Female", () => {
			beforeEach(() => {
				jest.spyOn(SpyPipewrench, "getSpecificPlayer").mockImplementation(() =>
					mock<IsoPlayer>({
						isFemale: () => true
					})
				);
			});

			it.each([
				{
					title: "Add_Sperm",
					expected: () => expect(womb.Debug.sperm.add).toHaveBeenCalledWith(0.1)
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
					mockCondition: () => ((pregnancy as any).pregnancy = null),
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
					expected: () => expect(lactation.Debug.add).toHaveBeenCalledWith(0.2)
				},
				{
					title: "Milk_Clear_Milk",
					expected: () => expect(lactation.Debug.set).toHaveBeenCalledWith(0)
				},
				{
					title: "Add_Pregnancy",
					mockCondition: () => ((pregnancy as any).pregnancy = null),
					expected: () => expect(SpyPipewrench.triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.PREGNANCY_START)
				},
				{
					title: "Remove_Pregnancy",
					mockCondition: () => ((pregnancy as any).pregnancy = mock()),
					expected: () => expect(SpyPipewrench.triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.PREGNANCY_STOP)
				},
				{
					title: "Advance_Pregnancy",
					mockCondition: () => ((pregnancy as any).pregnancy = mock()),
					expected: () => expect(pregnancy.Debug.advance).toHaveBeenCalled()
				},
				{
					title: "Advance_Pregnancy_Labor",
					mockCondition: () => ((pregnancy as any).pregnancy = mock()),
					expected: () => expect(pregnancy.Debug.advanceToLabor).toHaveBeenCalled()
				}
			])("option $title should trigger correct", ({ title, mockCondition, expected }) => {
				mockCondition && mockCondition();
				new ContextMenu({
					lactation,
					pregnancy,
					womb,
					options
				});
				const [addListener] = (Events.onFillWorldObjectContextMenu.addListener as jest.Mock)
					.mock.calls[0];
				addListener(1, context);
				const addOptions = mockSubmenu.addOption.mock.calls;
				const menuCall =
					addOptions.find(([call]) => (call as string).includes(title)) || [];
				const [, , action] = menuCall;
				action();
				expected();
			});
		});
	});
});
