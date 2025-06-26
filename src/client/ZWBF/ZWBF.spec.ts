jest.mock("@client/components/Lactation");
jest.mock("@client/components/Womb");
import { lactation, womb } from "./ZWBF";
describe("ZWBF", () => {
	it("Lactation should be defined", () => {
		expect(lactation).toBeDefined();
	});
	it("Womb should be defined", () => {
		expect(womb).toBeDefined();
	});
});
