import * as Events from "@asledgehammer/pipewrench-events";

import { ZWBFTraits } from "./ZWBFTraits";
import { TraitRegister } from "./TraitRegister";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@asledgehammer/pipewrench");

describe("ZWBFTraits", () => {
	const spyAddTrait = jest.fn();
	const spySetMutualExclusive = jest.fn();
	const createTraitRegister = (): TraitRegister => ({
		isAvailable: () => true,
		addTrait: spyAddTrait,
		setMutualExclusive: spySetMutualExclusive
	});
	const createUnavailableTraitRegister = (): TraitRegister => ({
		isAvailable: () => false,
		addTrait: jest.fn(),
		setMutualExclusive: jest.fn()
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("Registers addTraits on game boot", () => {
		new ZWBFTraits();
		expect(Events.onCreateLivingCharacter.addListener).toHaveBeenCalledTimes(1);
	});

	it("Should not call SetMutualExclusive if not needed", () => {
		new ZWBFTraits([
			{
				id: "zwbf:infertile",
				translationKey: "Infertile",
				cost: 1
			}
		], createTraitRegister());

		// simulate boot event
		const [addTraits] = (Events.onCreateLivingCharacter.addListener as jest.Mock).mock.calls[0];
		addTraits();

		expect(spySetMutualExclusive).not.toHaveBeenCalled();
	});

	it("Should call SetMutualExclusive acordingly", () => {
		new ZWBFTraits([
			{
				id: "zwbf:infertile",
				translationKey: "Infertile",
				cost: 1,
				exclusives: ["zwbf:fertile"]
			}
		], createTraitRegister());

		// simulate boot event
		const [addTraits] = (Events.onCreateLivingCharacter.addListener as jest.Mock).mock.calls[0];
		addTraits();

		expect(spySetMutualExclusive).toHaveBeenCalledWith("zwbf:infertile", "zwbf:fertile");
	});

	it("Does nothing when trait registrar is unavailable", () => {
		new ZWBFTraits(
			[
				{
					id: "zwbf:infertile",
					translationKey: "Infertile",
					cost: 1,
					exclusives: ["zwbf:fertile"]
				}
			],
			createUnavailableTraitRegister()
		);

		const [addTraits] = (Events.onCreateLivingCharacter.addListener as jest.Mock).mock.calls[0];
		addTraits();

		expect(spyAddTrait).not.toHaveBeenCalled();
		expect(spySetMutualExclusive).not.toHaveBeenCalled();
	});
});
