import { ZWBFTraits } from "@shared/components/ZWBFTraits";
jest.mock("@shared/components/ZWBFTraits");

describe("TraitClass event registration", () => {
	it("The TraitClass should be initialized", () => {
		// triggers event registration
		require("./ZWBFTraits");
		expect(ZWBFTraits).toHaveBeenCalled();
	});
});
