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
	const mockCharacter = mock<IsoGameCharacter>({ isFemale: isFemaleSpy });

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
	
	const scenarios = [
		/* Pills */
		{ name: "TakeContraceptive", type: "pill" },
		{ name: "TakeLactaid", type: "pill" },
		/* Milk */
		{ name: "HandExpress", type: "lactation" },
		{ name: "BreastPump", type: "lactation" },
		/* Womb */
		{ name: "ClearSperm", type: "womb" }
	];

	beforeEach(() => {
		jest.resetAllMocks();
		Object.defineProperty(SpyZWBF.lactation, "bottleAmount", {
			get: jest.fn(() => 0.2),
			configurable: true
		});
		Object.defineProperties(SpyZWBF.womb, {
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

				Object.defineProperty(SpyZWBF.lactation, "milkAmount", {
					get: jest.fn(() => 0.4),
					configurable: true
				});

				Object.defineProperty(SpyZWBF.womb, "amount", {
					get: jest.fn(() => 0.1),
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
				const filteredScenarios = scenarios.filter(({ type }) => type !== "pill");
				it.each(filteredScenarios)("Should return false for $name", ({ name }) => {
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
						get: jest.fn(() => 0.1),
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
			describe("Player cannot take pills", () => {
				it("Player is on contraceptive already", () => {
					isFemaleSpy.mockReturnValue(true);
					Object.defineProperty(SpyZWBF.womb, "contraceptive", {
						get: jest.fn(() => true),
						configurable: true
					});
					const result = ZWBFRecipes.OnTest.TakeContraceptive(mock(), mockCharacter);
					expect(result).toBeFalsy();
				});
				it("Player is pregnant already", () => {
					isFemaleSpy.mockReturnValue(true);
					Object.defineProperty(SpyZWBF.womb, "pregnancy", {
						get: jest.fn(() => true),
						configurable: true
					});
					const result = ZWBFRecipes.OnTest.TakeContraceptive(mock(), mockCharacter);
					expect(result).toBeFalsy();
				});
				it("Player is lactating already", () => {
					isFemaleSpy.mockReturnValue(true);
					Object.defineProperty(SpyZWBF.lactation, "isLactating", {
						get: jest.fn(() => true),
						configurable: true
					});
					const result = ZWBFRecipes.OnTest.TakeLactaid(mock(), mockCharacter);
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
				Object.defineProperties(SpyZWBF.womb, {
					contraceptive: {
						get: jest.fn(() => false),
						set: spySetContraceptive,
						configurable: true
					}
				});
				Object.defineProperties(SpyZWBF.lactation, {
					isLactating: {
						get: jest.fn(() => false),
						configurable: true
					}
				});
				SpyZWBF.lactation.toggle = spyToggleLactation;
			});
			it("Should set contraceptive to true when taking contraceptive pill", () => {
				ZWBFRecipes.OnCreate.TakeContraceptive(mock(), mockCharacter);
				expect(spySetContraceptive).toHaveBeenCalledWith(true);
			});
			it("Should toggle lactation on when taking lactaid pill", () => {
				ZWBFRecipes.OnCreate.TakeLactaid(mock(), mockCharacter);
				expect(spyToggleLactation).toHaveBeenCalledWith(true);
			});
		});
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
