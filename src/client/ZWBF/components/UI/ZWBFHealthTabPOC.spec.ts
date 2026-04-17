import * as Events from "@asledgehammer/pipewrench-events";
import { require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import {
	ZWBFEmbeddedHealthTabViewFactory,
	ZWBFHealthTabInjector,
	ZWBFHealthTabViewFactory
} from "./ZWBFHealthTabPOC";

jest.mock("@asledgehammer/pipewrench-events");

describe("ZWBFHealthTabPOC", () => {
	beforeEach(() => {
		delete (globalThis as any).ISCharacterInfoWindow;
		delete (globalThis as any).ISPanel;
	});

	it("registers install handler on onCreateUI", () => {
		const addListener = jest.fn();
		(Events as any).onCreateUI = { addListener };

		new ZWBFHealthTabInjector();

		expect(addListener).toHaveBeenCalledTimes(1);
	});

	it("patches createChildren and injects a single ZWBF tab", () => {
		const originalCreateChildren = jest.fn();
		(globalThis as any).ISCharacterInfoWindow = {
			createChildren: originalCreateChildren
		};
		const panel = {
			addView: jest.fn(),
			getView: jest.fn().mockReturnValue(undefined)
		};
		const view = {};
		const factory: ZWBFHealthTabViewFactory = {
			create: jest.fn().mockReturnValue(view)
		};

		const injector = new ZWBFHealthTabInjector(factory);
		injector.install();

		const windowInstance: any = { panel };
		(globalThis as any).ISCharacterInfoWindow.createChildren.call(windowInstance);
		(globalThis as any).ISCharacterInfoWindow.createChildren.call(windowInstance);

		expect(originalCreateChildren).toHaveBeenCalledTimes(2);
		expect(factory.create).toHaveBeenCalledTimes(1);
		expect(panel.addView).toHaveBeenCalledTimes(1);
		expect(panel.addView).toHaveBeenCalledWith("ZWBF", view);
	});

	it("embedded view factory builds a panel view and sets info text", () => {
		const panelNew = jest.fn().mockReturnValue({
			initialise: jest.fn(),
			drawTextCentre: jest.fn(),
			width: 200,
			height: 100
		});
		(globalThis as any).ISPanel = { new: panelNew };

		const factory = new ZWBFEmbeddedHealthTabViewFactory();
		const view = factory.create({ width: 320, height: 240 });

		expect(pipewrenchRequire).toHaveBeenCalledWith("ISUI/ISPanel");
		expect(panelNew).toHaveBeenCalled();
		expect(view.infoText).toBeDefined();
	});
});
