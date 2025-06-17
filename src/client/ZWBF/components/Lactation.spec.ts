import { mock } from "jest-mock-extended";
import { Lactation } from "./Lactation";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as SpyEvents from "@asledgehammer/pipewrench-events"
import * as SpyModData from "./ModData";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./ModData",() => ({
	ModData: class<T> {
		get data() { return jest.fn() as T }
		set data(value: T) { }
	}
}));
jest.mock("@utils", () => ({
	...jest.requireActual("@utils"),
	getSkinColor: jest.fn().mockImplementation(() => 1)
}));
describe("Lactation", () => {
	const SpyHasTrait = jest.fn().mockReturnValue(false);
	const mockedPlayer =  jest.fn(() => mock<IsoPlayer>({
		HasTrait: SpyHasTrait
	}));
	beforeEach(()=> {
		jest.clearAllMocks();
		SpyHasTrait.mockClear();
	});

	describe("Cases when player is not relevant", () => {
		it("bottleAmount should return expected value", () => {
			const lactation = new Lactation();
			expect(lactation.bottleAmount).toBe(200);
		});

		it("percentage should return expected value", () => {
			const lactation = new Lactation();
			expect(lactation.percentage).toBe(0);
		});
	});
	
	describe("player Isn't defined", () => {
		it("should be defined", () => {
			const lactation = new Lactation();
			expect(lactation).toBeDefined();
			expect(mockedPlayer).not.toHaveBeenCalled();
		});

		it("isLactating should be false", () => {
			const lactation = new Lactation();
			expect(lactation.isLactating).toBeFalsy();
		});
		
		it("get milkAmount should return 0", () => {
			const lactation = new Lactation();
			expect(lactation.milkAmount).toBe(0);
		});

		it("get multiplier should return 0", () => {
			const lactation = new Lactation();
			expect(lactation.multiplier).toBe(0);
		});
		
		it("useMilk", () => {
			const lactation = new Lactation();
			lactation.useMilk(100);
			expect(SpyHasTrait).not.toHaveBeenCalled();
		});
	});

	describe("player & data is defined", () => {
		beforeEach(() => {
			jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue({
				isActive: true,
				milkAmount: 400,
				expiration: 8,
				multiplier: 0
			});
			SpyHasTrait.mockReturnValue(true);
			jest.spyOn(SpyEvents.onCreatePlayer, 'addListener').mockImplementation((callback) => {
				callback(0, mockedPlayer())
			});
		});

		it("should be defined", () => {
			const lactation = new Lactation();
			expect(lactation).toBeDefined();
			expect(mockedPlayer).toHaveBeenCalled();
		});
		
		it("isLactating should return true", () => {
			const lactation = new Lactation();
			expect(lactation.isLactating).toBe(true);
		});

		it("milkAmount should return 400", () => {
			const lactation = new Lactation();
			expect(lactation.milkAmount).toBe(400);
		});

		it("useMilk Should verify Trait and remove milk accordingly", () => {
			const lactation = new Lactation();
			lactation.useMilk(100);
			expect(SpyHasTrait).toHaveBeenCalledWith("DairyCow");
			expect(lactation.milkAmount).toBe(300);
		});

		describe("Should update everyHour", () => {
			beforeEach(() => {
				// simulate the event being called twice
				jest.spyOn(SpyEvents.everyHours, 'addListener').mockImplementation((callback) => {
					callback();
					callback();
				});
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
					.mockReturnValue({
						isActive: true,
						milkAmount: 400,
						expiration: 1,
						multiplier: 0
					});
			});
			it("should update milkAmount", () => {
				const lactation = new Lactation();
				expect(lactation.isLactating).toBeFalsy();
			});
		});
		describe("Should update everyOneMinute", () => {
			beforeEach(() => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue({
					isActive: true,
					milkAmount: 900,
					expiration: 8,
					multiplier: 1
				});
				jest.spyOn(SpyEvents.everyOneMinute, "addListener").mockImplementation((callback) =>{
					callback();
				});
			});
			it("should update modData sucessfully", () => {
				const lactation = new Lactation();
				expect(lactation.isLactating).toBe(true);
			});
		});
		describe("Should update Pregnancy", () => {
			it.each([
				{ pregnancy: false, progress: 0, expected: false },
				{ pregnancy: true, progress: 0.4, expected: false },
				{ pregnancy: true, progress: 0.6, expected: true },
			])("when pregnancy is $pregnancy and progress is $progress", ({pregnancy, progress, expected}) => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue({
					isActive: false,
					milkAmount: 0,
					expiration: 0,
					multiplier: 0
				});
				jest.spyOn(SpyEvents.EventEmitter.prototype, 'addListener').mockImplementation((callback) => {
					callback({
						isPregnant: pregnancy,
						progress
					});
				});
				const lactation = new Lactation();
				expect(lactation.isLactating).toBe(expected)
			});
		});
	});

	describe("get images", () => {
		it.each([
			{ state: "normal", fullness: "empty", progress: 0.3, amount: 300, expected: "normal_empty.png" },
			{ state: "normal", fullness: "full", progress: 0.3, amount: 900, expected: "normal_full.png" },
			{ state: "early", fullness: "empty", progress: 0.5, amount: 300, expected: "pregnant_early_empty.png" },
			{ state: "early", fullness: "full", progress: 0.5, amount: 900, expected: "pregnant_early_full.png" },
			{ state: "late", fullness: "empty", progress: 0.9, amount: 300, expected: "pregnant_late_empty.png" },
			{ state: "late", fullness: "full", progress: 0.9, amount: 900, expected: "pregnant_late_full.png" },
		])("should return expected breast image for pregnancy state: $state and fullness: $fullness", ({ progress, amount, expected }) => {
			jest.spyOn(SpyEvents.EventEmitter.prototype, 'addListener').mockImplementation((callback) => {
				callback({
					isPregnant: true,
					progress
				});
			});
			jest.spyOn(SpyModData.ModData.prototype, "data", "get")
			.mockReturnValueOnce({
				isActive: true,
				milkAmount: amount,
				expiration: 8,
				multiplier: 1
			});

			const lactation = new Lactation();
			const { breasts } = lactation.images;
			expect(breasts).toBe(`media/ui/lactation/boob/color-1/${expected}`);
		});
	});
});
