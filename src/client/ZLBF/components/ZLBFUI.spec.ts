/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { ZLBFUI } from "./ZLBFUI";
import * as Events from "@asledgehammer/pipewrench-events";
import * as Pipewrench from "@asledgehammer/pipewrench";
import { Lactation } from "./Lactation";
import { Womb } from "./Womb";
import { Animation } from "@client/components/Animation";
import { PregnancyData } from "@types";
import { Pregnancy } from "./Pregnancy";
import { mockedPlayer } from "@test/mock";

jest.mock("@asledgehammer/pipewrench-events");

/* jest.mock("@client/components/UI/ZLBFTabManager", () => ({
	ZLBFTabManager: class {
		constructor() {}
		addTab() {}
		static new() {
			return {
				addTab: () => { }
			}
		}
	}
})); */

describe("ZLBFUI", () => {
	const addButton = jest.fn();

	beforeEach(() => {
		const defaultNewUI = NewZLBFUI();
		addButton.mockClear();
		(Pipewrench.require as jest.Mock).mockClear();

		Object.defineProperty(global, "NewZLBFUI", {
			writable: true,
			value: () => ({
				...defaultNewUI,
				addButton,
				"lactation-image": {
					setVisible: jest.fn(),
					setPath: jest.fn()
				},
				"lactation-level-title": {
					setVisible: jest.fn()
				},
				"lactation-level-amount": {
					setVisible: jest.fn(),
					setText: jest.fn()
				},
				"lactation-level-image": {
					setVisible: jest.fn(),
					setPath: jest.fn()
				},
				"womb-sperm-current-amount": {
					setText: jest.fn()
				},
				"womb-sperm-total-amount": {
					setText: jest.fn()
				},
				"womb-image": {
					setPath: jest.fn()
				},
				"womb-cycle-phase-value": {
					setText: jest.fn()
				},
				"womb-fertility-title": {
					setText: jest.fn()
				},
				"womb-fertility-bar": {
					setValue: jest.fn()
				},
				"womb-fertility-value": {
					setText: jest.fn()
				}
			})
		});
	});
	describe("Event System", () => {
		const addListener = jest.fn();
		it.each([
			/* should be in the same order as the code */
			{ event: "onCreateUI", handler: "onCreateUI" },
			{ event: "onCreatePlayer", handler: "onCreatePlayer" },
			{ event: "onPostRender", handler: "onUpdateUI" }
		])("Should register & call $event callback properly", ({ event, handler }) => {
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
		it.each([
			{ trait: true, female: true },
			{ trait: false, female: true },
			{ trait: true, female: false },
			{ trait: false, female: false }
		])(
			"should createUI properly when player is female: $female and INFERTILE trait: $trait",
			({ trait, female }) => {
				const isFemale = jest.fn().mockReturnValue(female);
				const player = mockedPlayer({
					isFemale
				});
				(player.getCharacterTraits().get as any).mockReturnValue(trait);

				(ui as any).onCreateUI();
				(ui as any).onCreatePlayer(player);
				expect(isFemale).toHaveBeenCalled();
				female && expect(player.getCharacterTraits().get).toHaveBeenCalled();
			}
		);

		it("should require ZLBFSimpleUI before creating UI", () => {
			(ui as any).onCreateUI();

			expect(Pipewrench.require "ZLBF/ZLBFSimpleUI");
		});

		it("Should call toggleLactationPanel properly", () => {
			const player = mockedPlayer({
				isFemale: () => true
			});
			(player.getCharacterTraits().get as any).mockReturnValue(false);
			(ui as any).onCreateUI();
			(ui as any).onCreatePlayer(player);
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
			{ uiVisible: false, female: true }
		])(
			"should do nothing if UI: $uiVisible and player is female: $female",
			({ uiVisible, female }) => {
				const ui = new ZLBFUI({
					lactation: mock(),
					pregnancy: mock(),
					womb: mock()
				});
				const isFemale = jest.fn().mockReturnValue(female);
				const player = mockedPlayer({ isFemale });
				(player.getCharacterTraits().get as any).mockReturnValue(false);

				(ui as any).onCreatePlayer(player);
				(ui as any).onCreateUI();
				// clear mock since onCreate can call the get as well
				(player.getCharacterTraits().get as any).mockClear();
				(ui as any).onUpdateUI();

				(ui as any).UI && ((ui as any).UI.isUIVisible = uiVisible);
				expect(player.getCharacterTraits().get).not.toHaveBeenCalled();
			}
		);
		it.each([{ pregnancy: null }, { pregnancy: { progress: 0.5 } as PregnancyData }])(
			"Should update UI when pregnancy is $pregnancy",
			({ pregnancy }) => {
				const player = mockedPlayer({
					isFemale: () => true
				});
				(player.getCharacterTraits().get as any).mockReturnValue(false);

				const ui = new ZLBFUI({
					lactation: mock<Lactation>({
						images: {
							breasts: "breasts.png",
							level: "level.png"
						}
					}),
					pregnancy: mock<Pregnancy>({ pregnancy }),
					womb: mock<Womb>({
						phaseTranslation: "mock-phase",
						fertility: 0.75,
						amount: 200,
						total: 400
					})
				});

				(ui as any).onCreatePlayer(player);
				(ui as any).onCreateUI();
				(ui as any).UI.isUIVisible = true;
				(ui as any).pregancy = { pregnancy };
				(ui as any).onUpdateUI();
				expect(player.getCharacterTraits().get).toHaveBeenCalled();
			}
		);
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
			(ui as any).UI = { toggle: toggleSpy };

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
