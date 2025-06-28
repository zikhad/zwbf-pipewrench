/* eslint-disable @typescript-eslint/no-explicit-any */
import { triggerEvent } from "@asledgehammer/pipewrench";
import { ZWBFEvents } from "../../../constants";
import { AnimationStatus } from "../../../types";

jest.mock("@asledgehammer/pipewrench");
jest.mock("ZomboWin/ZomboWin");

describe("AnimationHandler Event Insertion", () => {
	const ActionEvents: {
		Perform: ((action: any) => void)[];
		Update: ((action: any) => void)[];
		Stop: (() => void)[];
	} = {
		Perform: [],
		Update: [],
		Stop: []
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Provide ActionEvents for the module to use
		jest.doMock("ZomboWin/ZomboWin", () => ({
			AnimationHandler: { ActionEvents }
		}));

		// Import the module after mocks are ready
		require("./ZWBFWombFill"); // Replace with actual path
	});

	it("should trigger INTERCOURSE event for female on Perform", () => {
		const mockCharacter = { isFemale: () => true };
		const mockAction = { character: mockCharacter };

		ActionEvents.Perform[0](mockAction);
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEvents.INTERCOURSE);
	});

	it("should trigger ANIMATION_UPDATE on Update with payload", () => {
		const mockCharacter = { isFemale: () => true };
		const mockAction = {
			character: mockCharacter,
			duration: 30,
			getJobDelta: () => 0.5
		};

		ActionEvents.Update[0](mockAction);
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEvents.ANIMATION_UPDATE, {
			isActive: true,
			delta: 0.5,
			duration: 30
		} as AnimationStatus);
	});

	it("should trigger ANIMATION_UPDATE false on Stop", () => {
		ActionEvents.Stop[0]();
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEvents.ANIMATION_UPDATE, {
			isActive: false
		} as AnimationStatus);
	});
});
