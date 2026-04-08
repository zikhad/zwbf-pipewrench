/* eslint-disable @typescript-eslint/no-explicit-any */
import { triggerEvent, ArrayList } from "@asledgehammer/pipewrench";
import { ZWBFEventsEnum } from "@constants";
import { AnimationStatus } from "@types";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { mock } from "jest-mock-extended";

jest.mock("@asledgehammer/pipewrench", () => ({
	...jest.requireActual("@asledgehammer/pipewrench"),
	require: jest.fn(),
	getActivatedMods: jest.fn(),
	triggerEvent: jest.fn()
}));
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

		(globalThis as any).table = { 
			insert: jest.fn((array, item) => array.push(item))
		};

		const { require: mockRequire, getActivatedMods: mockGetActivatedMods } = require("@asledgehammer/pipewrench");
		mockGetActivatedMods.mockImplementation(() =>
			mock<ArrayList>({
				contains: jest.fn().mockReturnValue(true)
			})
		);
		mockRequire.mockReturnValue({
			AnimationHandler: { ActionEvents }
		});

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
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.INTERCOURSE);
	});

	it("should trigger ANIMATION_UPDATE on Update with payload", () => {
		const mockCharacter = { isFemale: () => true };
		const mockAction = {
			character: mockCharacter,
			duration: 30,
			getJobDelta: () => 0.5
		};

		ActionEvents.Update[0](mockAction);
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.ANIMATION_UPDATE, {
			isActive: true,
			delta: 0.5,
			duration: 30
		} as AnimationStatus);
	});

	it("should trigger ANIMATION_UPDATE false on Stop", () => {
		ActionEvents.Stop[0]();
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.ANIMATION_UPDATE, {
			isActive: false
		} as AnimationStatus);
	});
});
