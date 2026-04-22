import { percentageToNumber } from "./Utils";
describe("Utils", () => {
	describe("percentageToNumber", () => {
		it.each([
			{ num: 10, max: 100, expected: 10 },
			{ num: 10, max: 10, expected: 1 },
			{ num: 20, max: 10, expected: 2 }
		])(
			"should return $expected when number is $num and max is $max",
			({ num, max, expected }) => {
				const result = percentageToNumber(num, max);
				expect(result).toBe(expected);
			}
		);
	});
});
