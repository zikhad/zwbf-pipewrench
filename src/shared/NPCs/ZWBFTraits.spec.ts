import { ZWBFTraits } from "../components/ZWBFTraits";
jest.mock("../components/ZWBFTraits");

describe("TraitClass event registration", () => {
	it("The TraitClass should be initialized", () => {
		// triggers event registration
		require("./ZWBFTraits");
		expect(ZWBFTraits).toHaveBeenCalled();
	});
});
