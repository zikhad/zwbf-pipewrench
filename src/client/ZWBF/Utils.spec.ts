import { getSkinColor, percentageToNumber } from "./Utils";
import { mock } from "jest-mock-extended";
import { IsoPlayer } from "@asledgehammer/pipewrench";

describe("Utils", () => {
	describe("percentageToNumber", () => {
		it.each([
			{ num: 10, max: 100, expected: 10 },
			{ num: 10, max: 10, expected: 1 },
			{ num: 20, max: 10, expected: 2 }
		])("should return $expected when number is $num and max is $max", ({ num, max, expected }) => {
			const result = percentageToNumber(num, max);
			expect(result).toBe(expected);
		});
	});
	it("getSkinColor", () => {
		const getSkinTextureIndex = jest.fn().mockReturnValue(1);
		const mockedPlayer = mock<IsoPlayer>({
			getHumanVisual: jest.fn().mockImplementation(() => ({
				getSkinTextureIndex
			}))
		});
		const result = getSkinColor(mockedPlayer);
		expect(getSkinTextureIndex).toHaveBeenCalledWith();
		expect(result).toBe(1);
	});
});