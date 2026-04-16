/* eslint-disable @typescript-eslint/no-explicit-any */
import { triggerEvent, ArrayList } from "@asledgehammer/pipewrench";
import { ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { ZWBFEventsEnum } from "@constants";
import { AnimationConfig, ANIMATIONS } from "@client/components/Animation";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { mock } from "jest-mock-extended";

jest.mock("@asledgehammer/pipewrench", () => ({
	...jest.requireActual("@asledgehammer/pipewrench"),
	require: jest.fn(),
	getActivatedMods: jest.fn(),
	triggerEvent: jest.fn()
}));
jest.mock("@asledgehammer/pipewrench/client");
jest.mock("ZomboWin/ZomboWin");

/** A ZomboWin animation data entry whose first actor's first stage matches `animationId`. */
const makeZomboWinData = (animationId: string, tags: string[] = []) => [
	{
		prefix: "mocked",
		id: "mocked",
		tags,
		actors: [
			{ gender: "Female", stages: [{ perform: animationId, duration: 1000 }] },
			{ gender: "Male",   stages: [{ perform: animationId, duration: 1000 }] }
		]
	}
];

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

		// Default: queue has a matching allowed animation
		ISTimedActionQueue.getTimedActionQueue = jest.fn().mockReturnValue({
			queue: [{ animation: "allowed" }]
		});
		Object.defineProperty(global, "ZomboWinAnimationData", {
			value: makeZomboWinData("allowed"),
			writable: true
		});

		const { require: mockRequire, getActivatedMods: mockGetActivatedMods } = require("@asledgehammer/pipewrench");
		mockGetActivatedMods.mockImplementation(() =>
			mock<ArrayList>({
				contains: jest.fn().mockReturnValue(true)
			})
		);
		mockRequire.mockReturnValue({
			AnimationHandler: { ActionEvents }
		});

		jest.doMock("ZomboWin/ZomboWin", () => ({
			AnimationHandler: { ActionEvents }
		}));

		require("./ZWBFWombFill");
	});

	it("should trigger INTERCOURSE event for female on Perform", () => {
		const mockCharacter = { isFemale: () => true };
		const mockAction = { character: mockCharacter };

		ActionEvents.Perform[0](mockAction);
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.INTERCOURSE);
	});

	it("should always trigger ANIMATION_STOP on Perform regardless of gender", () => {
		const mockAction = { character: { isFemale: () => false } };
		ActionEvents.Perform[0](mockAction);
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.ANIMATION_STOP);
	});

	it("should trigger ANIMATION event on Update when female and animation is allowed", () => {
		const mockCharacter = { isFemale: () => true };
		const mockAction = {
			character: mockCharacter,
			duration: 30,
			getJobDelta: () => 0.5
		};

		ActionEvents.Update[0](mockAction);
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.ANIMATION, {
			animation: ANIMATIONS.INTERCOURSE,
			delta: 0.5,
			duration: 30
		} as AnimationConfig);
	});

	it("should NOT trigger ANIMATION on Update when animation has an excluded tag", () => {
		Object.defineProperty(global, "ZomboWinAnimationData", {
			value: makeZomboWinData("allowed", ["Oral"]),
			writable: true
		});

		const mockAction = {
			character: { isFemale: () => true },
			duration: 30,
			getJobDelta: () => 0.5
		};
		ActionEvents.Update[0](mockAction);
		expect(triggerEvent).not.toHaveBeenCalled();
	});

	it("should NOT trigger ANIMATION on Update when player is not female", () => {
		const mockAction = {
			character: { isFemale: () => false },
			duration: 30,
			getJobDelta: () => 0.5
		};
		ActionEvents.Update[0](mockAction);
		expect(triggerEvent).not.toHaveBeenCalled();
	});

	it("should NOT trigger ANIMATION on Update when no animation is queued", () => {
		ISTimedActionQueue.getTimedActionQueue = jest.fn().mockReturnValue({ queue: [] });

		const mockAction = {
			character: { isFemale: () => true },
			duration: 30,
			getJobDelta: () => 0.5
		};
		ActionEvents.Update[0](mockAction);
		expect(triggerEvent).not.toHaveBeenCalled();
	});

	it("should trigger ANIMATION_STOP on Stop", () => {
		ActionEvents.Stop[0]();
		expect(triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.ANIMATION_STOP);
	});
});
