import { mock } from "jest-mock-extended";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { Player } from "./Player";
import * as SpyModData from "./ModData";

jest.mock("./ModData");

type MockData = {
	mock: string;
};
class MockPlayer extends Player<MockData> {
	constructor() {
		super("MockPlayer");
	}
	public onCreatePlayer(player: IsoPlayer): void {
		super.onCreatePlayer(player);
	}
	onEveryMinute() {}
	onEveryHour() {}
}

describe("Player", () => {
	it("should initialize player with mod data", () => {
		const player = mock<IsoPlayer>();
		const playerInstance = new MockPlayer();

		jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue({
			mock: "mocked-data"
		});

		playerInstance.onCreatePlayer(player);

		// expect(playerInstance.player).toBe(player);
		expect(playerInstance.data).toBeDefined();
		expect(playerInstance.data?.mock).toBe("mocked-data");
	});
});
