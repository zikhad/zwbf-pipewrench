import { mock } from "jest-mock-extended";
import { IsoGameCharacter } from "@asledgehammer/pipewrench";
import * as SpyZWBF from "../client/ZWBF/ZWBF";

import "./ZWBFRecipes";

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
			get: jest.fn(() => 200),
			configurable: true
		});
	});
	describe("OnTest", () => {
		describe("Truthy scenarios", () => {
			beforeEach(() => {
				isFemaleSpy.mockReturnValue(true);

				Object.defineProperty(SpyZWBF.lactation, "milkAmount", {
					get: jest.fn(() => 400),
					configurable: true
				});

				Object.defineProperty(SpyZWBF.womb, "amount", {
					get: jest.fn(() => 100),
					configurable: true
				});
			});

			it.each(scenarios)("Should return true for $name", ({ name }) => {
				const result = ZWBFRecipes.OnTest[name](null as any, mockCharacter);
				expect(result).toBeTruthy();
			});
		});
		describe("Falsy scenarios", () => {
			describe("Player is NOT a Female", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(false);
				});
				it.each(scenarios)("Should return false for $name", ({ name }) => {
					const result = ZWBFRecipes.OnTest[name](null as any, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
			describe("Criteria of amounts does not match required values", () => {
				beforeEach(() => {
					isFemaleSpy.mockReturnValue(true);

					Object.defineProperty(SpyZWBF.lactation, "milkAmount", {
						get: jest.fn(() => 100),
						configurable: true
					});

					Object.defineProperty(SpyZWBF.womb, "amount", {
						get: jest.fn(() => 0),
						configurable: true
					});
				});
				it.each(scenarios)("Should return false for $name", ({ name }) => {
					const result = ZWBFRecipes.OnTest[name](null as any, mockCharacter);
					expect(result).toBeFalsy();
				});
			});
		});
	});
	describe("OnCreate", () => {
		describe("Lactation recipes", () => {
			const filteredScenarios = scenarios.filter(({ type }) => type == "lactation");
			it.each(filteredScenarios)("should call useMilk for $name", ({ name }) => {
				ZWBFRecipes.OnCreate[name](null, mockCharacter);
				expect(SpyZWBF.lactation.useMilk).toHaveBeenCalled();
			});
		});
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
				ZWBFRecipes.OnCreate[name](null, mockCharacter);
				expect(amountSetter).toHaveBeenCalled();
			});
		});
	});
});
