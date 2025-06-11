import * as ExampleAPI from "./api/ExampleAPI";
import * as PipeWrench from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

jest.mock("./api/ExampleAPI");
jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");

describe("Example module", () => {
	it("registers onGameStart listener and calls addRedSquare and greetPlayer", () => {
		(PipeWrench.getPlayer as jest.Mock).mockReturnValue("player");
		const addListener = Events.onGameStart.addListener as jest.Mock;
		require("./Example");

		expect(addListener).toHaveBeenCalledTimes(1);

		// Simulate the event firing
		const callback = addListener.mock.calls[0][0];
		callback();

		expect(ExampleAPI.addRedSquare).toHaveBeenCalled();
		expect(ExampleAPI.greetPlayer).toHaveBeenCalledWith("player");
	});
});
