import { lactation, womb, pregnancy, UI, effects, inventory } from "./ZWBF";

jest.mock("@client/components/Lactation");
jest.mock("@client/components/Womb");
jest.mock("@client/components/Pregnancy");
jest.mock("@client/components/Effects");
jest.mock("@client/components/DebugMenu");
jest.mock("@client/components/ZWBFUI");
jest.mock("@client/components/Inventory");

describe("ZWBF", () => {
	it.each([
		{ name: "Lactation", component: lactation },
		{ name: "Pregnancy", component: pregnancy },
		{ name: "Womb", component: womb },
		{ name: "Effects", component: effects },
		{ name: "UI", component: UI },
		{ name: "Inventory", component: inventory }
	])("$name should be defined", ({ component }) => {
		expect(component).toBeDefined();
	});
});
