import { mock } from "jest-mock-extended";
import * as SpyEvents from "@asledgehammer/pipewrench-events";
import * as SpyModData from "./ModData";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { WombData } from "../../../types";
import { Womb } from "./Womb";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./ModData");

describe("Womb", () => {
	describe("without plauer or data", () => {
		it("Should instantiate with default values", () => {
			const womb = new Womb();
			expect(womb.amount).toBe(0);
			expect(womb.total).toBe(0);
			expect(womb.cycleDay).toBe(0);
			expect(womb.fertility).toBe(0);
			expect(womb.onContraceptive).toBe(false);
			expect(womb.phase).toBe("Recovery");
		});
	});
	describe("With player & data are defined", () => {
		const mockedPlayer = () => mock<IsoPlayer>();
		const mockedModData: WombData = {
			amount: 200,
			total: 400,
			cycleDay: 1,
			fertility: 0,
			onContraceptive: true,
			chances: Womb.chances
		};
		beforeEach(() => {
			jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue(mockedModData)
			jest.spyOn(SpyEvents.onCreatePlayer, 'addListener').mockImplementation(cb => cb(0, mockedPlayer()));
		});
		it("should instantiate with data", () => {
			const womb = new Womb();
			expect(womb.amount).toBe(200);
			expect(womb.total).toBe(400);
			expect(womb.cycleDay).toBe(1);
			expect(womb.fertility).toBe(0);
			expect(womb.onContraceptive).toBe(true);
			expect(womb.phase).toBe("Menstruation");
		});
		it.each(
			[
				{ day: 0, phase: "Recovery" },
				{ day: 1, phase: "Menstruation" },
				{ day: 12, phase: "Follicular" },
				{ day: 15, phase: "Ovulation" },
				{ day: 17, phase: "Luteal" },
			]
		)("The cycle should be $phase when cycleday is $day", ({day, phase}) => {
			jest.spyOn(SpyModData.ModData.prototype, "data", "get")
				.mockReturnValue({
					...mockedModData,
					cycleDay: day
				});
			const womb = new Womb();
			expect(womb.phase).toBe(phase);
		});

		describe("Pregnancy", () => {
			it.each([
				{ isPregnant: false, progress: 0, phase: "Recovery" },
				{ isPregnant: true, progress: 0.5, phase: "Pregnant" },
			])("Cycle phase should be $phase if pregnancy is $pregnancy", ({ isPregnant, progress,  phase }) => {
				const womb = new Womb();
				womb.onPregnancyUpdate({ isPregnant, progress });
				expect(womb.phase).toBe(phase);
			});
			it("amount should be 0 is pregnancy progress is > 0.5", () => {
				const womb = new Womb();
				expect(womb.amount).toBe(200);
				womb.onPregnancyUpdate({ isPregnant: true, progress: 0.6 });
				expect(womb.amount).toBe(0);
			})
		});
	});
});