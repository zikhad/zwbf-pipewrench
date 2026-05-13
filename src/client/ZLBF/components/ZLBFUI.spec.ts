/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { ZLBFUI } from "@client/components/ZLBFUI";
import * as Events from "@asledgehammer/pipewrench-events";
import * as Pipewrench from "@asledgehammer/pipewrench";
import { mockedPlayer } from "@test/mock";

jest.mock("@asledgehammer/pipewrench-events");

describe("ZLBFUI", () => {
	const addListener = jest.fn();
	const newTabbedUI = jest.fn();

	beforeEach(() => {
		addListener.mockClear();
		newTabbedUI.mockClear();
		(Pipewrench.require as jest.Mock).mockClear();

		Object.defineProperty(global, "NewZLBFTabbedUI", {
			writable: true,
			value: newTabbedUI.mockImplementation(() => ({
				isUIVisible: false,
				setWidthPixel: jest.fn(),
				setTitle: jest.fn(),
				setVisible: jest.fn(),
				registerTab: jest.fn(),
				setActiveTab: jest.fn(),
				addText: jest.fn(),
				nextLine: jest.fn(),
				addProgressBar: jest.fn(),
				addButton: jest.fn(),
				addImage: jest.fn(),
				setBorderToAllElements: jest.fn(),
				saveLayout: jest.fn(),
				open: jest.fn(),
				close: jest.fn(),
				toggle: jest.fn(),
				"lactation-image": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"lactation-level-image": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-sperm-current-amount": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-sperm-total-amount": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-image": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-cycle-phase-value": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-fertility-title": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-fertility-bar": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				},
				"womb-fertility-value": {
					setPath: jest.fn(),
					setVisible: jest.fn(),
					setText: jest.fn(),
					setValue: jest.fn()
				}
			}))
		});
	});

	describe("Event System", () => {
		it.each([
			{ event: "onCreateUI", handler: "onCreateUI" },
			{ event: "onCreatePlayer", handler: "onCreatePlayer" },
			{ event: "onPostRender", handler: "onUpdateUI" }
		])( "should register and call $event callback", ({ event, handler }) => {
			(Events as any)[event] = { addListener };

			const ui = new ZLBFUI({
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
		});
	});

	describe("createUI", () => {
		let ui: ZLBFUI;

		beforeEach(() => {
			ui = new ZLBFUI({
				lactation: mock(),
				pregnancy: mock(),
				womb: mock()
			});
		});

		it("should require ZLBFTabbedUI before creating UI", () => {
			(ui as any).onCreateUI();

			expect(Pipewrench.require).toHaveBeenCalledWith("ZLBF/ZLBFTabbedUI");
			expect(newTabbedUI).toHaveBeenCalledTimes(1);
		});

		it.each([{ female: true }, { female: false }])(
			"should process onCreatePlayer for female=$female without throwing",
			({ female }) => {
				const isFemale = jest.fn().mockReturnValue(female);
				const player = mockedPlayer({ isFemale });
				(ui as any).onCreateUI();

				expect(() => (ui as any).onCreatePlayer(player)).not.toThrow();
				expect(isFemale).toHaveBeenCalled();
			}
		);

		it("should register tabs dynamically for female players", () => {
			const player = mockedPlayer({ isFemale: jest.fn().mockReturnValue(true) });
			(ui as any).onCreateUI();

			(ui as any).onCreatePlayer(player);

			const tabbedUI = newTabbedUI.mock.results[0].value;
			expect(tabbedUI.registerTab).toHaveBeenCalledTimes(2);
		});
	});

	describe("Toggle UI", () => {
		it("should not throw when toggling before UI is created", () => {
			const ui = new ZLBFUI({
				lactation: mock(),
				pregnancy: mock(),
				womb: mock()
			});

			expect(() => ui.toggle()).not.toThrow();
		});

		it("should toggle the UI", () => {
			const ui = new ZLBFUI({
				lactation: mock(),
				pregnancy: mock(),
				womb: mock()
			});

			const toggleSpy = jest.fn();
			(ui as any).UI = {
				isUIVisible: true,
				toggle: toggleSpy
			};

			ui.toggle();

			expect(toggleSpy).toHaveBeenCalled();
		});

		it("should return false visibility when UI is not created", () => {
			const ui = new ZLBFUI({
				lactation: mock(),
				pregnancy: mock(),
				womb: mock()
			});

			expect(ui.isVisible()).toBe(false);
		});

		it("should return the underlying UI visibility", () => {
			const ui = new ZLBFUI({
				lactation: mock(),
				pregnancy: mock(),
				womb: mock()
			});

			(ui as any).UI = { isUIVisible: true };

			expect(ui.isVisible()).toBe(true);
		});
	});
});
