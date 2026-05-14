import {
	defaultZLBFUITabs,
	LactationTab,
	WombTab,
	ZLBFUITabDefinition
} from "@client/components/UI/ZLBFUITabs";

describe("ZLBFUITabDefinition", () => {
	it("can be subclassed with concrete implementations", () => {
		class TestTab extends ZLBFUITabDefinition {
			readonly id = "Test";
			readonly TITLE_KEY = "IGUI_TEST";
			readonly ELEMENTS = { test: "test-element" };
			build = jest.fn();
			update = jest.fn();
		}

		const tab = new TestTab();
		expect(tab.id).toBe("Test");
		expect(tab.TITLE_KEY).toBe("IGUI_TEST");
		expect(tab).toBeInstanceOf(ZLBFUITabDefinition);
	});

	it("exposes build and update as callable methods", () => {
		class TestTab extends ZLBFUITabDefinition {
			readonly id = "Test";
			readonly TITLE_KEY = "IGUI_TEST";
			readonly ELEMENTS = { test: "test-element" };
			build = jest.fn();
			update = jest.fn();
		}

		const tab = new TestTab();
		const mockUI = {} as ZLBFTabbedUI;
		const mockCtx = {};

		tab.build(mockUI, mockCtx as any);
		tab.update(mockUI, mockCtx as any);

		expect(tab.build).toHaveBeenCalledWith(mockUI, mockCtx);
		expect(tab.update).toHaveBeenCalledWith(mockUI, mockCtx);
	});
});

describe("defaultZLBFUITabs", () => {
	it("contains exactly 2 tabs", () => {
		expect(defaultZLBFUITabs).toHaveLength(2);
	});

	it("first tab is WombTab", () => {
		expect(defaultZLBFUITabs[0]).toBeInstanceOf(WombTab);
	});

	it("second tab is LactationTab", () => {
		expect(defaultZLBFUITabs[1]).toBeInstanceOf(LactationTab);
	});

	it("each tab is an instance of ZLBFUITabDefinition", () => {
		for (const tab of defaultZLBFUITabs) {
			expect(tab).toBeInstanceOf(ZLBFUITabDefinition);
		}
	});

	it("tab ids are unique", () => {
		const ids = defaultZLBFUITabs.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
