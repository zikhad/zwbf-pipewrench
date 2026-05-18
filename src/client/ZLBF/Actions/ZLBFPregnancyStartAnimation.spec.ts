import { mock } from "jest-mock-extended";
import { IsoPlayer, ISBaseTimedAction } from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { ZLBFActionPregnancyStartAnimation } from "@client/Actions/ZLBFPregnancyStartAnimation";
import { ANIMATIONS } from "@client/components/Animation";
import { ZLBFEventsEnum } from "@constants";

jest.mock("@asledgehammer/pipewrench");

describe("ZLBFPregnancyStartAnimation", () => {
	let action: ZLBFActionPregnancyStartAnimation;
	const spyTriggerEvent = jest.spyOn(SpyPipewrench, "triggerEvent");

	beforeEach(() => {
		jest.clearAllMocks();
		// Setup ZombRandBetween on the mocked module before creating the action
		(SpyPipewrench as any).ZombRandBetween = (min: number, max: number) => 
			Math.floor(Math.random() * (max - min + 1)) + min;
		action = new ZLBFActionPregnancyStartAnimation(mock<IsoPlayer>());
	});

	it("isValid should be true", () => {
		expect(action.isValid()).toBe(true);
	});

	it("update should emit animation payload without variant", () => {
		action.start();
		jest.spyOn(action, "getJobDelta").mockReturnValue(0.5);
		action.update();

		expect(spyTriggerEvent).toHaveBeenCalledWith(
			ZLBFEventsEnum.ANIMATION_UPDATE,
			expect.objectContaining({
				delta: 0.5,
				duration: 800
			})
		);

		// variant is intentionally omitted; Animation.onAnimationStart sets Animation.variant
		// via the ANIMATION_START event and onAnimation uses it as default
		const callArgs = (spyTriggerEvent as jest.Mock).mock.calls.find(
			(call) => call[0] === ZLBFEventsEnum.ANIMATION_UPDATE
		);
		expect(callArgs?.[1]).not.toHaveProperty("variant");
	});

	it("start should emit ANIMATION_START with FERTILIZATION animation", () => {
		action.start();

		expect(spyTriggerEvent).toHaveBeenCalledWith(
			ZLBFEventsEnum.ANIMATION_START,
			ANIMATIONS.FERTILIZATION
		);
	});

	it("stop should trigger ANIMATION_STOP event", () => {
		action.stop();
		expect(spyTriggerEvent).toHaveBeenCalledWith(ZLBFEventsEnum.ANIMATION_STOP);
	});

	it("perform should trigger ANIMATION_STOP event", () => {
		action.perform();
		expect(spyTriggerEvent).toHaveBeenCalledWith(ZLBFEventsEnum.ANIMATION_STOP);
	});

	it("should configure timed action defaults", () => {
		expect(action.maxTime).toBe(800);
		expect(action.stopOnWalk).toBe(false);
		expect(action.stopOnRun).toBe(false);
		expect(action.stopOnAim).toBe(false);
	});

	it("update should call base update", () => {
		const spy = jest.spyOn(ISBaseTimedAction.prototype, "update");
		action.update();
		expect(spy).toHaveBeenCalled();
	});
});