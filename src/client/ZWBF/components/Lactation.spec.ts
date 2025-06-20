import { mock } from "jest-mock-extended";
import { Lactation } from "./Lactation";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as SpyEvents from "@asledgehammer/pipewrench-events";
import * as SpyModData from "./ModData";
import { LactationData } from "../../../types";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./ModData");
jest.mock("@utils", () => ({
	...jest.requireActual("@utils"),
	getSkinColor: jest.fn().mockReturnValue(1)
}));

describe("Lactation", () => {
	const SpyHasTrait = jest.fn().mockReturnValue(false);

	/* beforeEach(() => {
		jest.resetModules(); // clears require cache
  		jest.clearAllMocks(); // clears mock call history
	}); */

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
		const mockedPlayer = () => mock<IsoPlayer>({
			HasTrait: jest.fn().mockImplementation(SpyHasTrait)
		});
		beforeEach(() => {
			jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue({
				isActive: true,
				milkAmount: 400,
				expiration: 8,
				multiplier: 0
			});
			SpyHasTrait.mockReturnValue(true);
		});

		it("should initialize correctly and use traits", () => {
			const lactation = new Lactation();
			expect(lactation).toBeDefined();
			lactation.onCreatePlayer(mockedPlayer());
			expect(lactation.isLactating).toBe(true);
			expect(lactation.milkAmount).toBe(400);
		});
		
		it("useMilk updates milkAmount and checks trait", () => {
			const lactation = new Lactation();
			lactation.onCreatePlayer(mockedPlayer());
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
				}
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
				.mockReturnValueOnce(data)
				.mockReturnValue({
					...data,
					expiration: 0
				});
			});

			it("Should de-activate lactation when it expires", () => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(mockedPlayer());
				expect(lactation.isLactating).toBe(true);
				lactation.onEveryHour();
				expect(lactation.isLactating).toBe(false); // because of expiration logic
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
				jest.spyOn(SpyEvents.everyOneMinute, "addListener").mockImplementation(cb => cb());
			});
			
			it("should keep lactation active", () => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(mockedPlayer());
				expect(lactation.isLactating).toBe(true);
			});
		});
		
		describe("Debug functions", () => {
			it.each<{ operation: "add" | "remove" | "set"; expected: number }>([
				{ operation: "add", expected: 500 },
				{ operation: "remove", expected: 300 },
				{ operation: "set", expected: 100 }
			])("should $operation milk", ({ operation, expected }) => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(mockedPlayer());
				lactation.Debug.set(400);
				lactation.Debug[operation](100);
				expect(lactation.milkAmount).toBe(expected);
			});
			it("should be able to toggle lactation", () => {
				const lactation = new Lactation();
				lactation.onCreatePlayer(mockedPlayer());
				expect(lactation.isLactating).toBe(true);
				lactation.Debug.toggle(false);
				expect(lactation.isLactating).toBe(false);
			});
		});
	});

	describe("Pregnancy events", () => {
		it.each([
			/* { pregnancy: false, progress: 0, expected: false }, */
			{ /* pregnancy: true, */ progress: 0.4, expected: false },
			{ /* pregnancy: true, */ progress: 0.8, expected: true }
		])(
			"Lactation should be $expected when pregnancy progress is: $progress",
			({ /* pregnancy, */ progress, expected }) => {
				/* SpyHasTrait.mockReturnValue(true); */
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
					.mockReturnValueOnce({ progress })
					.mockReturnValue({
						isActive: false,
						milkAmount: 0,
						expiration: 0,
						multiplier: 0
					});

				const lactation = new Lactation();
				lactation.onCreatePlayer(mock<IsoPlayer>({
					HasTrait: jest.fn().mockImplementation(() => true)
				}))
				lactation.onPregnancyUpdate({ progress });
				expect(lactation.isLactating).toBe(expected);
			}
		);
	});

	describe("Image resolution", () => {
		it.each([
			/* {
				state: "normal",
				fullness: "empty",
				progress: 0.3,
				amount: 300,
				expected: "normal_empty.png"
			},
			{
				state: "normal",
				fullness: "full",
				progress: 0.3,
				amount: 900,
				expected: "normal_full.png"
			}, */
			{
				state: "early",
				fullness: "empty",
				progress: 0.5,
				amount: 300,
				expected: "pregnant_early_empty.png"
			},
			{
				state: "early",
				fullness: "full",
				progress: 0.5,
				amount: 900,
				expected: "pregnant_early_full.png"
			},
			{
				state: "late",
				fullness: "empty",
				progress: 0.9,
				amount: 300,
				expected: "pregnant_late_empty.png"
			},
			{
				state: "late",
				fullness: "full",
				progress: 0.9,
				amount: 900,
				expected: "pregnant_late_full.png"
			}
		])(
			"returns correct image for $state pregnancy and $fullness",
			({ progress, amount, expected }) => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
				// first call is to gather pregnancy
				.mockReturnValueOnce({ progress })
				// second call is to gather lactation
				.mockReturnValue({
					isActive: true,
					milkAmount: amount,
					expiration: 8,
					multiplier: 1
				});

				const lactation = new Lactation();
				lactation.onCreatePlayer(mock<IsoPlayer>({
					HasTrait: jest.fn().mockImplementation(() => true)
				}));
				expect(lactation.images.breasts).toBe(
					`media/ui/lactation/boob/color-1/${expected}`
				);
			}
		);
	});
});
