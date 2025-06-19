import * as Events from "@asledgehammer/pipewrench-events";

import { ZWBFTraits } from "./ZWBFTraits";
import { TraitFactory } from "@asledgehammer/pipewrench";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@asledgehammer/pipewrench");

describe("ZWBFTraits", () => {
	const spyAddTrait = jest.fn();
	const spySetMutialExclusive = jest.fn();
	beforeEach(() => {
		jest.resetAllMocks();
		TraitFactory.addTrait = spyAddTrait;
		TraitFactory.setMutualExclusive = spySetMutialExclusive;
	});

	it("Registers addTraits on game boot", () => {
		new ZWBFTraits();
		expect(Events.onGameBoot.addListener).toHaveBeenCalledTimes(1);
	});

	it("Should not call SetMutualExclusive if not needed", () => {
		new ZWBFTraits([
			{
				id: "Infertile",
				cost: 1
			}
		]);

		// simulate boot event
		const [addTraits] = (Events.onGameBoot.addListener as jest.Mock).mock.calls[0];
		addTraits();

		expect(spySetMutialExclusive).not.toHaveBeenCalled();
	});

	it("Should call SetMutualExclusive acordingly", () => {
		new ZWBFTraits([
			{
				id: "Infertile",
				cost: 1,
				exclusives: ["Fertile"]
			}
		]);

		// simulate boot event
		const [addTraits] = (Events.onGameBoot.addListener as jest.Mock).mock.calls[0];
		addTraits();

		expect(spySetMutialExclusive).toHaveBeenCalledWith("Infertile", "Fertile");
	});
});
