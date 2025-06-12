import * as Events from "@asledgehammer/pipewrench-events";

jest.mock("@asledgehammer/pipewrench-events");

describe("ZWBFDistributions", () => {
	// TODO: check how to test this
	it.skip("Should call addItemsToDistributions onPreDistributionMerge", () => {
		require("./ZWBFDistributions");
		const [callback] = (Events.onPreDistributionMerge.addListener as jest.Mock).mock.calls
		callback();
	});
});