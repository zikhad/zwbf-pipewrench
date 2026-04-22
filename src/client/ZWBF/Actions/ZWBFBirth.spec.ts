import { mock } from "jest-mock-extended";
import { ZWBFActionBirth } from "./ZWBFBirth";
import { Pregnancy } from "@client/components/Pregnancy";
import { ISBaseTimedAction } from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";

jest.mock("@asledgehammer/pipewrench");

describe("ZWBFBirth", () => {
	let action: ZWBFActionBirth;
	const spyPregnancyBirth = jest.fn();
	const spyTriggerEvent = jest.spyOn(SpyPipewrench, "triggerEvent");

	beforeEach(() => {
		action = new ZWBFActionBirth(mock<Pregnancy>({ birth: spyPregnancyBirth }));
	});

	it("isValid should be true", () => {
		expect(action.isValid()).toBe(true);
	});

	it("Start should set action anim", () => {
		const spy = jest.spyOn(ISBaseTimedAction.prototype, "setActionAnim");
		action.start();
		expect(spy).toHaveBeenCalled();
	});

	it("Update should trigger ANIMATION_UPDATE event", () => {
		action.update();
		expect(spyTriggerEvent).toHaveBeenCalled();
	});

	it("Perform should trigger ANIMATION_UPDATE & Pregnancy Birth", () => {
		action.perform();
		expect(spyTriggerEvent).toHaveBeenCalled();
		expect(spyPregnancyBirth).toHaveBeenCalled();
	});
});
