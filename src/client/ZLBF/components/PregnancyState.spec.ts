import { mock } from "jest-mock-extended";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { ZLBFTraitsEnum } from "@constants";
import { PregnancyState } from "./PregnancyState";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";

jest.mock("@shared/components/CharacterTraitApi");

describe("PregnancyState", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("persists updates through shared getModData storage", () => {
		(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(true);

		const sharedStore: Record<string, unknown> = {};
		const player = mock<IsoPlayer>({
			getModData: jest.fn(() => sharedStore)
		});

		PregnancyState.initialize(player);
		PregnancyState.set(player, {
			current: 123,
			progress: 0.5,
			isInLabor: false
		});

		expect(PregnancyState.get(player)).toEqual({
			current: 123,
			progress: 0.5,
			isInLabor: false
		});
		expect(sharedStore["ZLBFPregnancy"]).toEqual({
			current: 123,
			progress: 0.5,
			isInLabor: false
		});
	});

	it("returns null when player is missing pregnancy trait", () => {
		(CharacterTraitApi.hasTrait as jest.Mock).mockReturnValue(false);

		const player = mock<IsoPlayer>({
			getModData: jest.fn(() => ({}))
		});

		expect(PregnancyState.get(player)).toBeNull();
		expect(CharacterTraitApi.hasTrait).toHaveBeenCalledWith(player, ZLBFTraitsEnum.PREGNANCY);
	});
});
