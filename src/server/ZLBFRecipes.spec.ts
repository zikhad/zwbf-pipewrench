import { mock } from "jest-mock-extended";
import { IsoGameCharacter, InventoryItem } from "@asledgehammer/pipewrench";
import * as SpyZLBF from "../client/ZLBF/ZLBF";

import { ZLBFRecipes } from "./ZLBFRecipes";
import { Fluids } from "@constants";
import { CraftRecipeData, Fluid } from "./types";

jest.mock("@asledgehammer/pipewrench");
jest.mock("../client/ZLBF/ZLBF", () => ({
	lactation: {
		milkAmount: 0,
		bottleAmount: 0,
		useMilk: jest.fn()
	},
	womb: {
		amount: 0
	}
}));

describe("ZLBFRecipes.ts", () => {
	const isFemaleSpy = jest.fn();
	const hasBabySpy = jest.fn();
	const mockCharacter = mock<IsoGameCharacter>({
		isFemale: isFemaleSpy,
		getInventory: () => ({ contains: hasBabySpy })
	} as unknown as IsoGameCharacter);
	const createMockItemWithContainer = ({
		removeFluid = jest.fn(),
		addFluid = jest.fn(),
		getFreeCapacity = jest.fn(() => 0),
		getCapacity = jest.fn(() => 1.0),
		isFull = jest.fn(() => false),
		isEmpty = jest.fn(() => false),
		getAmount = jest.fn(() => 0),
		getPrimaryFluid = jest.fn(() => Fluids.HUMAN_MILK)
	}: Partial<{
		removeFluid: () => void;
		addFluid: () => void;
		getFreeCapacity: () => number;
		getCapacity: () => number;
		isFull: () => boolean,
		isEmpty: () => boolean,
		getAmount: () => number,
		getPrimaryFluid: () => Fluid
	}> = {}) => {
		return mock<InventoryItem>({
			getFluidContainer: jest.fn(() => ({
				removeFluid,
				addFluid,
				getFreeCapacity,
				getCapacity,
				isFull,
				isEmpty,
				getAmount,
				getPrimaryFluid,
			}))
		});
	};
	
	const scenarios = [
		/* Pills */
		{ name: "TakeContraceptive", type: "pill" },
		{ name: "TakeLactaid", type: "pill" },
		/* Milk */
		{ name: "HandExpress", type: "lactation" },
		{ name: "BreastPump", type: "lactation" },
		/* Womb */
		{ name: "ClearSperm", type: "womb" },
		{ name: "PushCum", type: "womb" },
		/* Baby */
		{ name: "BreastFeedBaby", type: "baby" },
		{ name: "BottleFeedBaby", type: "baby" }
	];

	beforeEach(() => {
		jest.resetAllMocks();
		Object.defineProperty(SpyZLBF.lactation, "bottleAmount", {
			get: jest.fn(() => 0.2),
			configurable: true
		});
		Object.defineProperties(SpyZLBF.womb, {
			pregnancy: {
				get: jest.fn(() => false),
				configurable: true
			},
			contraceptive: {
				get: jest.fn(() => false),
				set: jest.fn(),
				configurable: true
			}
		});
	});

	describe("OnTest", () => {
		describe("Truthy scenarios", () => {
			beforeEach(() => {
				isFemaleSpy.mockReturnValue(true);
				hasBabySpy.mockReturnValue(true);

				Object.defineProperty(SpyZLBF.lactation, "milkAmount", {
					get: jest.fn(() => 0.4),
					configurable: true
				});

				Object.defineProperty(SpyZLBF.womb, "amount", {
					get: jest.fn(() => 0.1),
					configurable: true
				});
			});

			it.each(scenarios)("Should return true for $name", ({ name }) => {
				const mockItem = createMockItemWithContainer({
					isFull: jest.fn(() => false),
					getAmount: jest.fn(() => 1)
				});
				const result = ZLBFRecipes.OnTest[name](mockItem, mockCharacter);
				expect(result).toBeTruthy();
			});
		});
		describe("Falsy scenarios", () => {
			describe("Player is NOT a Female", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(false);
				});
				it.each(scenarios)("Should return false for $name", ({ name }) => {
					const mockItem = createMockItemWithContainer({ isFull: jest.fn(() => false) });
					const result = ZLBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Criteria of amounts does not match required values", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);

					Object.defineProperty(SpyZLBF.lactation, "milkAmount", {
						get: jest.fn(() => 0.1),
						configurable: true
					});

					Object.defineProperty(SpyZLBF.womb, "amount", {
						get: jest.fn(() => 0),
						configurable: true
					});
				});
				const filteredScenarios = scenarios.filter(({ type }) => type !== "pill");
				it.each(filteredScenarios)("Should return false for $name", ({ name }) => {
					const mockItem = createMockItemWithContainer({ isFull: jest.fn(() => false) });
					const result = ZLBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Container is full", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);

					Object.defineProperty(SpyZLBF.lactation, "milkAmount", {
						get: jest.fn(() => 0.4),
						configurable: true
					});

					Object.defineProperty(SpyZLBF.womb, "amount", {
						get: jest.fn(() => 0.1),
						configurable: true
					});
				});

				const lactationScenarios = scenarios.filter(({ type }) => type === "lactation");

				it.each(lactationScenarios)("Should return false for $name when container is full", ({ name }) => {
					const mockItem = createMockItemWithContainer({ isFull: jest.fn(() => true) });
					const result = ZLBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});

				it("Should return true for ClearSperm even when container is full", () => {
					const mockItem = createMockItemWithContainer({ isFull: jest.fn(() => true) });
					const result = ZLBFRecipes.OnTest.ClearSperm(mockItem, mockCharacter);
					expect(result).toBeTruthy();
				});
			});
			describe("Player cannot take pills", () => {
				it("Player is on contraceptive already", () => {
					isFemaleSpy.mockReturnValue(true);
					Object.defineProperty(SpyZLBF.womb, "contraceptive", {
						get: jest.fn(() => true),
						configurable: true
					});
					const result = ZLBFRecipes.OnTest.TakeContraceptive(mock(), mockCharacter);
					expect(result).toBeFalsy();
				});
				it("Player is pregnant already", () => {
					isFemaleSpy.mockReturnValue(true);
					Object.defineProperty(SpyZLBF.womb, "pregnancy", {
						get: jest.fn(() => true),
						configurable: true
					});
					const result = ZLBFRecipes.OnTest.TakeContraceptive(mock(), mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Player does not have a Baby", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);
					hasBabySpy.mockReturnValue(false);
				});
				const babyScenarios = scenarios.filter(({ type }) => type === "baby");
				it.each(babyScenarios)("Should return false for $name", ({ name }) => {
					const mockItem = createMockItemWithContainer();
					const result = ZLBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Primary Fluid is NOT Milk", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);
					hasBabySpy.mockReturnValue(true);
				});
				it("Should return false for BottleFeedBaby ", () => {
					const mockItem = createMockItemWithContainer({
						getPrimaryFluid: jest.fn(() => Fluids.SEMEN)
					});
					const result = ZLBFRecipes.OnTest.BottleFeedBaby(mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
		});
	});
	describe("OnCreate", () => {
		describe("Pill recipes", () => {
			const spySetContraceptive = jest.fn();
			const spyToggleLactation = jest.fn();
			beforeEach(() => {
				isFemaleSpy.mockReturnValue(true);
				Object.defineProperties(SpyZLBF.womb, {
					contraceptive: {
						get: jest.fn(() => false),
						set: spySetContraceptive,
						configurable: true
					}
				});
				Object.defineProperties(SpyZLBF.lactation, {
					isLactating: {
						get: jest.fn(() => false),
						configurable: true
					}
				});
				SpyZLBF.lactation.toggle = spyToggleLactation;
			});
			it("Should set contraceptive to true when taking contraceptive pill", () => {
				ZLBFRecipes.OnCreate.TakeContraceptive(mock(), mockCharacter);
				expect(spySetContraceptive).toHaveBeenCalledWith(true);
			});
			it("Should toggle lactation on when taking lactaid pill", () => {
				ZLBFRecipes.OnCreate.TakeLactaid(mock(), mockCharacter);
				expect(spyToggleLactation).toHaveBeenCalledWith(true);
			});
		});
		describe("Lactation recipes", () => {
			const filteredScenarios = scenarios.filter(({ type }) => type == "lactation");
			it.each(filteredScenarios)("should call useMilk for $name", ({ name }) => {
				const getFreeCapacity = jest.fn(() => 1.0);
				const isFull = jest.fn(() => false);
				const isEmpty = jest.fn(() => false);
				const getCapacity = jest.fn(() => 1.0);

				const mockContainerItem = createMockItemWithContainer({
					isFull,
					isEmpty,
					getCapacity,
					getFreeCapacity,
				});

				const mockItems = {
					getInputItems: jest.fn(() => ({
						get: jest.fn(() => mockContainerItem)
					}))
				} as unknown as CraftRecipeData;
				ZLBFRecipes.OnCreate[name](mockItems, mockCharacter);
				expect(SpyZLBF.lactation.useMilk).toHaveBeenCalled();
			});
		});
		describe("Milk bottle creation", () => {
			const filteredScenarios = scenarios.filter(({ name }) => ["HandExpress", "BreastPump"].includes(name));
			it.each(filteredScenarios)("should fill created result with HumanMilk for $name", ({ name }) => {
				const addFluid = jest.fn();
				const getFreeCapacity = jest.fn(() => 1.0);
				const isFull = jest.fn(() => false);
				const isEmpty = jest.fn(() => false);
				const getCapacity = jest.fn(() => 1.0);
				
				const mockContainerItem = createMockItemWithContainer({
					getFreeCapacity,
					addFluid,
					isFull,
					isEmpty,
					getCapacity
				})

				const mockItems = mock<CraftRecipeData>({
					getInputItems: jest.fn(() => ({
						get: jest.fn(() => mockContainerItem)
					}))
				} as unknown as CraftRecipeData);

				ZLBFRecipes.OnCreate[name](mockItems, mockCharacter);
				expect(addFluid).toHaveBeenCalledWith("HumanMilk", 0.2);
			});
		})
		describe("Womb recipes", () => {
			const amountSetter = jest.fn();
			beforeEach(() => {
				Object.defineProperty(SpyZLBF.womb, "amount", {
					set: amountSetter,
					configurable: true
				});
			});

			const filteredScenarios = scenarios.filter(({ type }) => type == "womb");
			it.each(filteredScenarios)("should call womb functions on $name", ({ name }) => {
				const getFreeCapacity = jest.fn(() => 1.0);
				const getCapacity = jest.fn(() => 1.0);
				
				const mockContainerItem = createMockItemWithContainer({
					getCapacity,
					getFreeCapacity
				});
				
				const mockItems = mock<CraftRecipeData>({
					getInputItems: jest.fn(() => ({
						get: jest.fn(() => mockContainerItem)
					}))
				} as unknown as CraftRecipeData);
				ZLBFRecipes.OnCreate[name](mockItems, mockCharacter);
				expect(amountSetter).toHaveBeenCalled();
			});
		});
		describe("Baby recipes", () => {
			it("BreastFeedBaby should call useMilk with bottleAmount", () => {
				Object.defineProperty(SpyZLBF.lactation, "milkAmount", {
					get: jest.fn(() => 0.4),
					configurable: true
				});
				ZLBFRecipes.OnCreate.BreastFeedBaby(mock(), mock());
				expect(SpyZLBF.lactation.useMilk).toHaveBeenCalledWith(0.2, expect.any(Number));
			});
			it("BottleFeedBaby should gather bottleAmount from lactation to use it", () => {
				const mockContainerItem = createMockItemWithContainer({});
				const mockItems = mock<CraftRecipeData>({
					getInputItems: jest.fn(() => ({
						get: jest.fn(() => mockContainerItem)
					}))
				} as unknown as CraftRecipeData);

				const bottleAmountSpy = jest.spyOn(SpyZLBF.lactation, "bottleAmount", "get");

				ZLBFRecipes.OnCreate.BottleFeedBaby(mockItems, mock());
				expect(bottleAmountSpy).toHaveBeenCalled();
			});
		});
	});
});
