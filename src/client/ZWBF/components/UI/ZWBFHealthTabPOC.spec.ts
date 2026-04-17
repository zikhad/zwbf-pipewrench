import * as Events from "@asledgehammer/pipewrench-events";
import { require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import { mock } from "jest-mock-extended";
import {
	ZWBFEmbeddedHealthTabViewFactory,
	ZWBFHealthTabInjector,
	ZWBFHealthTabViewFactory
} from "./ZWBFHealthTabPOC";
import { Lactation } from "../Lactation";
import { Womb } from "../Womb";
import { Pregnancy } from "../Pregnancy";
import { PregnancyData } from "@types";
import { mockedPlayer } from "@test/mock";

jest.mock("@asledgehammer/pipewrench-events");

const makePanelMock = () => ({
	addText: jest.fn(),
	addImage: jest.fn(),
	addProgressBar: jest.fn(),
	addButton: jest.fn(),
	nextLine: jest.fn(),
	saveLayout: jest.fn(),
	setBorderToAllElements: jest.fn(),
	setWidthPixel: jest.fn(),
	yAct: 0,
	"tab-lactation-image": { setPath: jest.fn() },
	"tab-lactation-level-image": { setPath: jest.fn() },
	"tab-womb-sperm-current-amount": { setText: jest.fn() },
	"tab-womb-sperm-total-amount": { setText: jest.fn() },
	"tab-womb-image": { setPath: jest.fn() },
	"tab-womb-cycle-phase-value": { setText: jest.fn() },
	"tab-womb-fertility-title": { setText: jest.fn() },
	"tab-womb-fertility-bar": { setValue: jest.fn() },
	"tab-womb-fertility-value": { setText: jest.fn() },
});

const makeProps = (overrides: Partial<{ lactation: Lactation; womb: Womb; pregnancy: Pregnancy }> = {}) => ({
	lactation: mock<Lactation>({ images: { breasts: "b.png", level: "l.png" } }),
	womb: mock<Womb>({ phaseTranslation: "mock-phase", fertility: 0.5, amount: 0.1, total: 0.5 }),
	pregnancy: mock<Pregnancy>({ pregnancy: null }),
	...overrides
});

describe("ZWBFHealthTabPOC", () => {
	beforeEach(() => {
		delete (globalThis as any).ISCharacterInfoWindow;
		delete (globalThis as any).NewZWBFPanel;
	});

	describe("Event System", () => {
		it.each([
			{ event: "onCreateUI", handler: "install" },
			{ event: "onCreatePlayer", handler: "onCreatePlayer" },
			{ event: "onPostRender", handler: "onUpdateUI" },
		])("registers $event listener that calls $handler", ({ event, handler }) => {
			const addListener = jest.fn();
			(Events as any)[event] = { addListener };

			const injector = new ZWBFHealthTabInjector(makeProps());
			const spy = jest.spyOn(injector as any, handler);

			expect(addListener).toHaveBeenCalled();
			const [callback] = addListener.mock.calls[0];
			callback();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe("install", () => {
		it("patches createChildren and injects a single ZWBF tab", () => {
			const originalCreateChildren = jest.fn();
			(globalThis as any).ISCharacterInfoWindow = { createChildren: originalCreateChildren };
			const tabPanel = { addView: jest.fn(), getView: jest.fn().mockReturnValue(undefined) };
			const view = makePanelMock();
			const factory: ZWBFHealthTabViewFactory = { create: jest.fn().mockReturnValue(view) };

			const injector = new ZWBFHealthTabInjector(makeProps(), factory);
			injector.install();

			const windowInstance: any = { panel: tabPanel };
			(globalThis as any).ISCharacterInfoWindow.createChildren.call(windowInstance);
			(globalThis as any).ISCharacterInfoWindow.createChildren.call(windowInstance);

			expect(originalCreateChildren).toHaveBeenCalledTimes(2);
			expect(factory.create).toHaveBeenCalledTimes(1);
			expect(tabPanel.addView).toHaveBeenCalledTimes(1);
			expect(tabPanel.addView).toHaveBeenCalledWith("ZWBF", view);
		});

		it("stores the panel reference from the factory", () => {
			const originalCreateChildren = jest.fn();
			(globalThis as any).ISCharacterInfoWindow = { createChildren: originalCreateChildren };
			const tabPanel = { addView: jest.fn(), getView: jest.fn().mockReturnValue(undefined) };
			const view = makePanelMock();
			const factory: ZWBFHealthTabViewFactory = { create: jest.fn().mockReturnValue(view) };

			const injector = new ZWBFHealthTabInjector(makeProps(), factory);
			injector.install();
			(globalThis as any).ISCharacterInfoWindow.createChildren.call({ panel: tabPanel });

			expect((injector as any).panel).toBe(view);
		});
	});

	describe("onCreatePlayer", () => {
		it.each([
			{ infertile: false },
			{ infertile: true },
		])("adds UI elements when player is female (infertile: $infertile)", ({ infertile }) => {
			const panel = makePanelMock();
			const injector = new ZWBFHealthTabInjector(makeProps());
			(injector as any).panel = panel;

			const player = mockedPlayer({ isFemale: jest.fn().mockReturnValue(true) });
			(player.getCharacterTraits().get as any).mockReturnValue(infertile);

			(injector as any).onCreatePlayer(player);

			expect(panel.addText).toHaveBeenCalled();
			expect(panel.addImage).toHaveBeenCalled();
			expect(panel.saveLayout).toHaveBeenCalled();

			if (infertile) {
				expect(panel.addProgressBar).not.toHaveBeenCalled();
			} else {
				expect(panel.addProgressBar).toHaveBeenCalled();
			}
		});

		it("does nothing when player is not female", () => {
			const panel = makePanelMock();
			const injector = new ZWBFHealthTabInjector(makeProps());
			(injector as any).panel = panel;

			const player = mockedPlayer({ isFemale: jest.fn().mockReturnValue(false) });
			(injector as any).onCreatePlayer(player);

			expect(panel.addText).not.toHaveBeenCalled();
		});

		it("does nothing when panel is not ready", () => {
			const injector = new ZWBFHealthTabInjector(makeProps());
			const player = mockedPlayer({ isFemale: jest.fn().mockReturnValue(true) });
			expect(() => (injector as any).onCreatePlayer(player)).not.toThrow();
		});
	});

	describe("onUpdateUI", () => {
		it.each([
			{ pregnancy: null },
			{ pregnancy: { progress: 0.5 } as PregnancyData }
		])("updates element values when player is female (pregnancy: $pregnancy)", ({ pregnancy }) => {
			const panel = makePanelMock();
			const injector = new ZWBFHealthTabInjector(makeProps({
				pregnancy: mock<Pregnancy>({ pregnancy })
			}));
			(injector as any).panel = panel;

			const player = mockedPlayer({ isFemale: jest.fn().mockReturnValue(true) });
			(player.getCharacterTraits().get as any).mockReturnValue(false);
			(injector as any).player = player;

			(injector as any).onUpdateUI();

			expect(panel["tab-womb-cycle-phase-value"].setText).toHaveBeenCalled();
			expect(panel["tab-womb-sperm-current-amount"].setText).toHaveBeenCalled();
			expect(panel["tab-lactation-image"].setPath).toHaveBeenCalledWith("b.png");
		});

		it("does nothing when panel is not ready", () => {
			const injector = new ZWBFHealthTabInjector(makeProps());
			expect(() => (injector as any).onUpdateUI()).not.toThrow();
		});

		it("does nothing when player is not female", () => {
			const panel = makePanelMock();
			const injector = new ZWBFHealthTabInjector(makeProps());
			(injector as any).panel = panel;
			(injector as any).player = mockedPlayer({ isFemale: jest.fn().mockReturnValue(false) });

			(injector as any).onUpdateUI();

			expect(panel["tab-womb-cycle-phase-value"].setText).not.toHaveBeenCalled();
		});
	});

	describe("ZWBFEmbeddedHealthTabViewFactory", () => {
		it("creates a panel using NewZWBFPanel and requires ZWBFSimpleUI", () => {
			const panelMock = makePanelMock();
			(globalThis as any).NewZWBFPanel = jest.fn().mockReturnValue(panelMock);

			const factory = new ZWBFEmbeddedHealthTabViewFactory();
			const view = factory.create({ width: 320, height: 240 });

			expect(pipewrenchRequire).toHaveBeenCalledWith("ZWBF/ZWBFSimpleUI");
			expect((globalThis as any).NewZWBFPanel).toHaveBeenCalledWith(0, 8, 320, 232);
			expect(view).toBe(panelMock);
		});

		it("uses panel.width over window.width when available", () => {
			const panelMock = makePanelMock();
			(globalThis as any).NewZWBFPanel = jest.fn().mockReturnValue(panelMock);

			const factory = new ZWBFEmbeddedHealthTabViewFactory();
			factory.create({ panel: { width: 500 }, width: 320, height: 200 });

			expect((globalThis as any).NewZWBFPanel).toHaveBeenCalledWith(0, 8, 500, 192);
		});

		it("returns empty object when NewZWBFPanel is not available", () => {
			const factory = new ZWBFEmbeddedHealthTabViewFactory();
			const view = factory.create({ width: 320, height: 240 });
			expect(view).toEqual({});
		});
	});
});
