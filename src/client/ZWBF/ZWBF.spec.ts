jest.mock("@client/components/Lactation");
jest.mock("@client/components/Womb");
jest.mock("@client/components/Pregnancy");
import { lactation, womb, pregnancy, UI } from "./ZWBF";
describe("ZWBF", () => {
	it.each([
		{ name: "Lactation", component: lactation },
		{ name: "Pregnancy", component: lactation },
		{ name: "Womb", component: lactation },
		{ name: "UI", component: lactation },

	])("$component should be defined", ({ component }) => {
		expect(component).toBeDefined();
	});
});
