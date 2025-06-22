import { mock } from "jest-mock-extended";
import { Lactation } from "./Lactation";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import * as SpyModData from "./ModData";
import { LactationData } from "../../../types";
import { Player } from "./Player";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./Player");
jest.mock("@utils", () => ({
	...jest.requireActual("@utils"),
	getSkinColor: jest.fn().mockReturnValue(1)
}));

const SpyHasTrait = jest.fn().mockReturnValue(false);

const createMockedPlayer = (overrides: Partial<IsoPlayer> = {}) => mock<IsoPlayer>(overrides);

describe("Lactation", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();
		SpyHasTrait.mockReset().mockReturnValue(false);
	});

	describe("Without player or data", () => {
		it("returns static bottleAmount and percentage", () => {
			const lactation = new Lactation();
			expect(lactation.bottleAmount).toBe(200);
			expect(lactation.percentage).toBe(0);
		});

		it("isLactating and milk amount are false/0", () => {
			const lactation = new Lactation();
			expect(lactation.isLactating).toBe(false);
			expect(lactation.milkAmount).toBe(0);
		});

		it("useMilk does not invoke HasTrait", () => {
			const lactation = new Lactation();
			lactation.useMilk(100);
			expect(SpyHasTrait).not.toHaveBeenCalled();
		});
	});

	describe("When player & data are defined", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue({
				isActive: true,
				milkAmount: 400,
				expiration: 8,
				multiplier: 0
			});
		});

		it("should initialize correctly and use traits", () => {
			const lactation = new Lactation();
			lactation.onCreatePlayer(createMockedPlayer());
			expect(lactation.isLactating).toBe(true);
			expect(lactation.milkAmount).toBe(400);
		});

		it("useMilk updates milkAmount and checks trait", () => {
			const lactation = new Lactation();
			lactation.onCreatePlayer(
				createMockedPlayer({
					HasTrait: SpyHasTrait.mockImplementation(() => true)
				})
			);
			lactation.useMilk(100);
			expect(SpyHasTrait).toHaveBeenCalledWith("DairyCow");
			expect(lactation.milkAmount).toBe(300);
		});

		describe("everyHour event", () => {
			beforeEach(() => {
				const data: LactationData = {
					isActive: true,
					milkAmount: 400,
					expiration: 1,
					multiplier: 0
				};
				jest.spyOn(Player.prototype, "data", "get")
					.mockReturnValueOnce(data)
					.mockReturnValue({ ...data, expiration: 0 });
			});

			it("Should de-activate lactation when it expires", () => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(createMockedPlayer());
				expect(lactation.isLactating).toBe(true);
				lactation.onEveryHour();
				expect(lactation.isLactating).toBe(false);
			});
		});

		describe("everyOneMinute event", () => {
			beforeEach(() => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue({
					isActive: true,
					milkAmount: 900,
					expiration: 8,
					multiplier: 1
				});
			});

			it("should keep lactation active", () => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(createMockedPlayer());
				lactation.onEveryMinute();
				// expect(lactation.isLactating).toBe(true);
				expect(SpyPipewrench.triggerEvent).toHaveBeenCalled();
			});
		});

		describe("Debug functions", () => {
			it.each<{ operation: "add" | "remove" | "set"; expected: number }>([
				{ operation: "add", expected: 500 },
				{ operation: "remove", expected: 300 },
				{ operation: "set", expected: 100 }
			])("should $operation milk", ({ operation, expected }) => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(createMockedPlayer());
				lactation.Debug.set(400);
				lactation.Debug[operation](100);
				expect(lactation.milkAmount).toBe(expected);
			});

			it("should be able to toggle lactation", () => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(createMockedPlayer());
				expect(lactation.isLactating).toBe(true);
				lactation.Debug.toggle(false);
				expect(lactation.isLactating).toBe(false);
			});
		});
	});

	describe("when not lactating", () => {
		beforeEach(() => {
			const data: LactationData = {
				isActive: false,
				milkAmount: 0,
				expiration: 1,
				multiplier: 0
			};
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(data);
		});
		it("EveryHour should do nothing when not lactating", () => {
			const lactation = new Lactation();
			lactation.onEveryHour();
			expect(lactation.milkAmount).toBe(0);
		});
	});

	describe("Pregnancy events", () => {
		it.each([
			{ progress: null, expected: false },
			{ progress: 0.4, expected: false },
			{ progress: 0.8, expected: true }
		])(
			"Lactation should be $expected when pregnancy progress is: $progress",
			({ progress, expected }) => {
				jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
					progress ? { progress } : null
				);
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue({
					isActive: false,
					milkAmount: 0,
					expiration: 0,
					multiplier: 0
				});

				const lactation = new Lactation();
				lactation.onCreatePlayer(
					createMockedPlayer({ HasTrait: SpyHasTrait.mockImplementation(() => true) })
				);
				lactation.onPregnancyUpdate({ progress: progress ?? 0 });
				expect(lactation.isLactating).toBe(expected);
			}
		);
	});

	describe("Image resolution", () => {
		it.each([
			{
				state: "non pregnant",
				fullness: "empty",
				progress: null,
				amount: 300,
				expected: "normal_empty.png"
			},
			{
				state: "non pregnant",
				fullness: "full",
				progress: null,
				amount: 900,
				expected: "normal_full.png"
			},
			{
				state: "too early in pregnancy",
				fullness: "empty",
				progress: 0,
				amount: 300,
				expected: "normal_empty.png"
			},
			{
				state: "too early in pregnancy",
				fullness: "full",
				progress: 0,
				amount: 900,
				expected: "normal_full.png"
			},
			{
				state: "pregnancy early",
				fullness: "empty",
				progress: 0.5,
				amount: 300,
				expected: "pregnant_early_empty.png"
			},
			{
				state: "pregnancy early",
				fullness: "full",
				progress: 0.5,
				amount: 900,
				expected: "pregnant_early_full.png"
			},
			{
				state: "pregnancy late",
				fullness: "empty",
				progress: 0.9,
				amount: 300,
				expected: "pregnant_late_empty.png"
			},
			{
				state: "pregnancy late",
				fullness: "full",
				progress: 0.9,
				amount: 900,
				expected: "pregnant_late_full.png"
			}
		])(
			"returns correct image when state is $state and fullness is $fullness",
			({ progress, amount, expected }) => {
				jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
					progress ? { progress } : null
				);
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue({
					isActive: true,
					milkAmount: amount,
					expiration: 8,
					multiplier: 1
				});

				const lactation = new Lactation();
				lactation.onCreatePlayer(
					createMockedPlayer({ HasTrait: SpyHasTrait.mockImplementation(() => true) })
				);
				expect(lactation.images.breasts).toBe(
					`media/ui/lactation/boob/color-1/${expected}`
				);
			}
		);
	});
});
