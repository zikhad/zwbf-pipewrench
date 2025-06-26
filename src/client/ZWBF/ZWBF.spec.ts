import { lactation, womb, pregnancy, UI, effects } from "./ZWBF";

jest.mock("@client/components/Lactation");
jest.mock("@client/components/Womb");
jest.mock("@client/components/Pregnancy");
jest.mock("@client/components/Effects");

describe("ZWBF", () => {
	it.each([
		{ name: "Lactation", component: lactation },
		{ name: "Pregnancy", component: pregnancy },
		{ name: "Womb", component: womb },
		{ name: "Effects", component: effects},
		{ name: "UI", component: UI },

	])("$name should be defined", ({ component }) => {
		expect(component).toBeDefined();
	});
});
