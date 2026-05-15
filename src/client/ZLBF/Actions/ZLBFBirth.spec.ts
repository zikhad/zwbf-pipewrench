import { mock } from "jest-mock-extended";
import { ANIMATIONS } from "@client/components/Animation";
import { ZLBFActionBirth } from "@client/Actions/ZLBFBirth";
import { Pregnancy } from "@client/components/Pregnancy";
import { ISBaseTimedAction } from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { ZLBFEventsEnum } from "@constants";

jest.mock("@asledgehammer/pipewrench");

describe("ZLBFBirth", () => {
	let action: ZLBFActionBirth;
	const spyPregnancyBirth = jest.fn();
	const spyTriggerEvent = jest.spyOn(SpyPipewrench, "triggerEvent");

	beforeEach(() => {
		jest.clearAllMocks();
		action = new ZLBFActionBirth(mock<Pregnancy>({ birth: spyPregnancyBirth }));
	});

	it("isValid should be true", () => {
		expect(action.isValid()).toBe(true);
	});

	it("Start should set action anim", () => {
		const spy = jest.spyOn(ISBaseTimedAction.prototype, "setActionAnim");
		action.start();
		expect(spy).toHaveBeenCalled();
	});

	it("Start should trigger ANIMATION_START event with BIRTH animation", () => {
		action.start();
		expect(spyTriggerEvent).toHaveBeenCalledWith(
			ZLBFEventsEnum.ANIMATION_START,
			ANIMATIONS.BIRTH
		);
	});

	it("Update should trigger ANIMATION_UPDATE event", () => {
		action.update();
		expect(spyTriggerEvent).toHaveBeenCalled();
	});

	it("Stop should trigger ANIMATION_STOP event", () => {
		spyTriggerEvent.mockClear();
		action.stop();
		expect(spyTriggerEvent).toHaveBeenCalledWith(ZLBFEventsEnum.ANIMATION_STOP);
	});

	it("Perform should trigger ANIMATION_UPDATE & Pregnancy Birth", () => {
		action.perform();
		expect(spyTriggerEvent).toHaveBeenCalled();
		expect(spyPregnancyBirth).toHaveBeenCalled();
	});
});
