import { mock } from "jest-mock-extended";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { ISBaseTimedAction } from "@asledgehammer/pipewrench";
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
		action = new ZLBFActionPregnancyStartAnimation(mock<IsoPlayer>());
	});

	it("isValid should be true", () => {
		expect(action.isValid()).toBe(true);
	});

	it("update should emit animation payload", () => {
		jest.spyOn(action, "getJobDelta").mockReturnValue(0.5);

		action.update();

		expect(spyTriggerEvent).toHaveBeenCalledWith(
			ZLBFEventsEnum.ANIMATION,
			expect.objectContaining({
				animation: ANIMATIONS.FERTILIZATION,
				delta: 0.5,
				duration: 800
			})
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