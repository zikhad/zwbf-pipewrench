import { mock } from "jest-mock-extended";
import { IsoGameCharacter, InventoryItem } from "@asledgehammer/pipewrench";
import * as SpyZWBF from "../client/ZWBF/ZWBF";

import { ZWBFRecipes } from "./ZWBFRecipes";

jest.mock("@asledgehammer/pipewrench");
jest.mock("../client/ZWBF/ZWBF", () => ({
	lactation: {
		milkAmount: 0,
		bottleAmount: 0,
		useMilk: jest.fn()
	},
	womb: {
		amount: 0
	}
}));

describe("ZWBFRecipes.ts", () => {
	const isFemaleSpy = jest.fn();
	let mockCharacter: IsoGameCharacter;

	const scenarios = [
		{ name: "HandExpress", type: "lactation" },
		{ name: "BreastPump", type: "lactation" },
		{ name: "ClearSperm", type: "womb" }
	];

	beforeEach(() => {
		jest.resetAllMocks();
		mockCharacter = mock<IsoGameCharacter>({ isFemale: isFemaleSpy });
		Object.defineProperty(SpyZWBF.lactation, "bottleAmount", {
			get: jest.fn(() => 0.2),
			configurable: true
		});
	});

	const createMockItemWithContainer = (isFull: boolean = false) => {
		return mock<InventoryItem>({
			getFluidContainer: jest.fn(() => ({
				removeFluid: jest.fn(),
				addFluid: jest.fn(),
				getFreeCapacity: jest.fn(() => isFull ? 0 : 1.0),
				getCapacity: jest.fn(() => 1.0),
				isFull: jest.fn(() => isFull),
				isEmpty: jest.fn(() => false)
			}))
		});
	};

	describe("OnTest", () => {
		describe("Truthy scenarios", () => {
			beforeEach(() => {
				isFemaleSpy.mockReturnValue(true);

				Object.defineProperty(SpyZWBF.lactation, "milkAmount", {
					get: jest.fn(() => 0.4),
					configurable: true
				});

				Object.defineProperty(SpyZWBF.womb, "amount", {
					get: jest.fn(() => 100),
					configurable: true
				});
			});

			it.each(scenarios)("Should return true for $name", ({ name }) => {
				const mockItem = createMockItemWithContainer(false);
				const result = ZWBFRecipes.OnTest[name](mockItem, mockCharacter);
				expect(result).toBeTruthy();
			});
		});
		describe("Falsy scenarios", () => {
			describe("Player is NOT a Female", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(false);
				});
				it.each(scenarios)("Should return false for $name", ({ name }) => {
					const mockItem = createMockItemWithContainer(false);
					const result = ZWBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Criteria of amounts does not match required values", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);

					Object.defineProperty(SpyZWBF.lactation, "milkAmount", {
						get: jest.fn(() => 0.1),
						configurable: true
					});

					Object.defineProperty(SpyZWBF.womb, "amount", {
						get: jest.fn(() => 0),
						configurable: true
					});
				});
				it.each(scenarios)("Should return false for $name", ({ name }) => {
					const mockItem = createMockItemWithContainer(false);
					const result = ZWBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Container is full", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);

					Object.defineProperty(SpyZWBF.lactation, "milkAmount", {
						get: jest.fn(() => 0.4),
						configurable: true
					});

					Object.defineProperty(SpyZWBF.womb, "amount", {
						get: jest.fn(() => 100),
						configurable: true
					});
				});

				const lactationScenarios = scenarios.filter(({ type }) => type === "lactation");

				it.each(lactationScenarios)("Should return false for $name when container is full", ({ name }) => {
					const mockItem = createMockItemWithContainer(true);
					const result = ZWBFRecipes.OnTest[name](mockItem, mockCharacter);
					expect(result).toBeFalsy();
				});

				it("Should return true for ClearSperm even when container is full", () => {
					const mockItem = createMockItemWithContainer(true);
					const result = ZWBFRecipes.OnTest.ClearSperm(mockItem, mockCharacter);
					expect(result).toBeTruthy();
				});
			});
		});
	});
	describe("OnCreate", () => {
		describe("Lactation recipes", () => {
			const filteredScenarios = scenarios.filter(({ type }) => type == "lactation");
			it.each(filteredScenarios)("should call useMilk for $name", ({ name }) => {
				const removeFluid = jest.fn();
				const addFluid = jest.fn();
				const getFreeCapacity = jest.fn(() => 1.0);
				const isFull = jest.fn(() => false);
				const isEmpty = jest.fn(() => false);
				const getCapacity = jest.fn(() => 1.0);

				const mockContainerItem = mock<InventoryItem>({
					getFluidContainer: jest.fn(() => ({
						removeFluid,
						addFluid,
						getFreeCapacity,
						getCapacity,
						isFull,
						isEmpty
					}))
				});

				const mockItems = {
					getInputItems: jest.fn(() => ({
						get: jest.fn(() => mockContainerItem)
					}))
				};
				ZWBFRecipes.OnCreate[name](mockItems as any, mockCharacter);
				expect(SpyZWBF.lactation.useMilk).toHaveBeenCalled();
			});
		});

		describe("Milk bottle creation", () => {
			const filteredScenarios = scenarios.filter(({ name }) => ["HandExpress", "BreastPump"].includes(name));
			it.each(filteredScenarios)("should fill created result with HumanMilk for $name", ({ name }) => {
				const removeFluid = jest.fn();
				const addFluid = jest.fn();
				const getFreeCapacity = jest.fn(() => 1.0);
				const isFull = jest.fn(() => false);
				const isEmpty = jest.fn(() => false);
				const getCapacity = jest.fn(() => 1.0);
				
				const mockContainerItem = mock<InventoryItem>({
					getFluidContainer: jest.fn(() => ({
						removeFluid,
						addFluid,
						getFreeCapacity,
						getCapacity,
						isFull,
						isEmpty
					}))
				});

				const mockItems = {
					getInputItems: jest.fn((index: number) => ({
						get: jest.fn(() => mockContainerItem)
					}))
				};

				ZWBFRecipes.OnCreate[name](mockItems as any, mockCharacter);
				expect(addFluid).toHaveBeenCalledWith("HumanMilk", 0.2);
			});
		})

		describe("Womb recipes", () => {
			const amountSetter = jest.fn();
			beforeEach(() => {
				Object.defineProperty(SpyZWBF.womb, "amount", {
					set: amountSetter,
					configurable: true
				});
			});

			const filteredScenarios = scenarios.filter(({ type }) => type == "womb");
			it.each(filteredScenarios)("should call womb functions on $name", ({ name }) => {
				const removeFluid = jest.fn();
				const addFluid = jest.fn();
				const getFreeCapacity = jest.fn(() => 1.0);
				const isFull = jest.fn(() => false);
				const isEmpty = jest.fn(() => false);
				const getCapacity = jest.fn(() => 1.0);
				
				const mockContainerItem = mock<InventoryItem>({
					getFluidContainer: jest.fn(() => ({
						removeFluid,
						addFluid,
						getFreeCapacity,
						getCapacity,
						isFull,
						isEmpty
					}))
				});
				
				const mockItems = {
					getInputItems: jest.fn(() => ({
						get: jest.fn(() => mockContainerItem)
					}))
				};
				ZWBFRecipes.OnCreate[name](mockItems as any, mockCharacter);
				expect(amountSetter).toHaveBeenCalled();
			});
		});
	});
});
