import { mock } from "jest-mock-extended";
import * as SpyEvents from "@asledgehammer/pipewrench-events";
import * as SpyModData from "./ModData";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { WombData } from "../../../types";
import { Womb } from "./Womb";
import * as SpyUtils from "../Utils";
import {ZWBFTraitsEnum} from "../../../constants";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./ModData");
jest.mock("@utils", () => ({
	...jest.requireActual("@utils"),
	Inventory: {
		hasItem: jest.fn()
	}
}));

describe("Womb", () => {

	const mockedPlayer = (overrides: Partial<IsoPlayer> = {}) => mock<IsoPlayer>({ ...overrides });
	const mockedModData =  (overrides: Partial<WombData> = {}): WombData => ({
		amount: 200,
		total: 400,
		cycleDay: 1,
		fertility: 0,
		onContraceptive: true,
		chances: Womb.chances,
		...overrides
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("without player or data", () => {
		it("Should instantiate with default values", () => {
			const womb = new Womb();
			expect(womb.amount).toBe(0);
			expect(womb.total).toBe(0);
			expect(womb.cycleDay).toBe(0);
			expect(womb.fertility).toBe(0);
			expect(womb.onContraceptive).toBe(false);
			expect(womb.phase).toBe("Recovery");
			expect(womb.image).toBe("");
		});
	});

	describe("With player & data are defined", () => {
		const mockedAnimationUpdateEvent = jest.fn();

		beforeEach(() => {
			jest.spyOn(SpyModData.ModData.prototype, "data", "get").mockReturnValue(mockedModData());
			jest.spyOn(SpyEvents.onCreatePlayer, 'addListener')
				.mockImplementation(cb => cb(0, mockedPlayer()));
			jest.spyOn(SpyEvents.everyOneMinute, 'addListener')
				.mockImplementation(cb => cb());
			jest.spyOn(SpyEvents.EventEmitter.prototype, 'addListener')
				.mockImplementation(cb => {
					mockedAnimationUpdateEvent();
					cb({ isActive: true, delta: 500, duration: 1000 });
				});
		});

		it("should instantiate with data", () => {
			const womb = new Womb();
			expect(womb.amount).toBe(200);
			expect(womb.total).toBe(400);
			expect(womb.cycleDay).toBe(1);
			expect(womb.fertility).toBe(0);
			expect(womb.onContraceptive).toBe(true);
			expect(womb.phase).toBe("Menstruation");
			expect(mockedAnimationUpdateEvent).toHaveBeenCalled();
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
				.mockReturnValue(mockedModData({ cycleDay: day }));
			const womb = new Womb();
			expect(womb.phase).toBe(phase);
		});

		describe("get still Images", () => {
			it.each([
				{ amount: 0, expected: "media/ui/womb/normal/womb_normal_0.png" },
				{ amount: 1, expected: "media/ui/womb/normal/womb_normal_1.png" },
				{ amount: 1000, expected: "media/ui/womb/normal/womb_normal_17.png" },
			])("Image should be $expected if sperm amount is $amount", ({amount, expected}) => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
					.mockReturnValue(mockedModData({ amount }));
				const womb = new Womb();
				expect(womb.image).toBe(expected);
			});
		});

		describe("get scene Images", () => {
			it.each([
				/* Not pregnant */
				{ amount: 0, isPregnant: false, condom: false, expected: "media/ui/animation/normal/empty/0.png" },
				{ amount: 0, isPregnant: false, condom: true, expected: "media/ui/animation/condom/0.png" },
				{ amount: 900, isPregnant: false, condom: false, expected: "media/ui/animation/normal/full/0.png" },
				{ amount: 900, isPregnant: false, condom: true, expected: "media/ui/animation/condom/0.png" },
				/* Pregnant */
				{ amount: 0, isPregnant: true, condom: false, expected: "media/ui/animation/pregnant/0.png" },
				{ amount: 0, isPregnant: true, condom: true, expected: "media/ui/animation/condom/0.png" },
				{ amount: 900, isPregnant: true, condom: false, expected: "media/ui/animation/pregnant/0.png" },
				{ amount: 900, isPregnant: true, condom: true, expected: "media/ui/animation/condom/0.png" },
			])("Should return $expected when pregnancy: $isPregnant, condom: $condom and amount: $amount", ({isPregnant, condom, amount, expected}) => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
					.mockReturnValue(mockedModData({ amount }));
				jest.spyOn(SpyUtils.Inventory, 'hasItem')
					.mockReturnValue(condom);
				
				const womb = new Womb();
				womb.onPregnancyUpdate({ isPregnant, progress: 0.6 });
				womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });
				expect(womb.image).toBe(expected);
			});
			it("should return labor animation", () => {
				jest.spyOn(SpyUtils.Inventory, 'hasItem').mockReturnValue(false);
				const womb = new Womb();
				womb.onPregnancyUpdate({ isPregnant: true, progress: 1, isInLabor: true });
				womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });
				expect(womb.image).toBe("media/ui/animation/birth/0.png");
			});
		});

		describe("Pregnancy", () => {
			it.each([
				{ isPregnant: false, progress: 0, phase: "Menstruation" },
				{ isPregnant: true, progress: 0.5, phase: "Pregnant" },
			])("Cycle phase should be $phase if pregnancy is $pregnancy", ({ isPregnant, progress,  phase }) => {
				const womb = new Womb();
				womb.onPregnancyUpdate({ isPregnant, progress });
				expect(womb.phase).toBe(phase);
			});
			it("amount should be 0 if pregnancy progress is > 0.5", () => {
				const womb = new Womb();
				expect(womb.amount).toBe(200);
				womb.onPregnancyUpdate({ isPregnant: true, progress: 0.6 });
				expect(womb.amount).toBe(0);
			});
			it.each([
				{ progress: 0, amount: 0, expected: "media/ui/womb/conception/womb_conception_0.png" },
				{ progress: 0, amount: 1000, expected: "media/ui/womb/conception/womb_conception_17.png" },
				{ progress: 0.8, amount: 1000, expected: "media/ui/womb/pregnant/womb_pregnant_4.png" },
				{ progress: 0.95, amount: 1000, expected: "media/ui/womb/pregnant/womb_pregnant_6.png" },
			])("still image should be $expected when progress is $progress and amount is $amount", ({progress, amount, expected}) => {
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
				.mockReturnValue(mockedModData({ amount }));
				const womb = new Womb();
				womb.onPregnancyUpdate({ isPregnant: true, progress });
				expect(womb.image).toBe(expected);
			});
		});
	});

	describe("Fertility", () => {
			const spyHasTrait = jest.fn().mockImplementation(() => true); 
			beforeEach(() => {
				spyHasTrait.mockClear();
				jest.spyOn(SpyModData.ModData.prototype, "data", "get")
					.mockReturnValue(mockedModData({
						onContraceptive: false,
						cycleDay: 15
					}));
			});

			// TODO: fix the following test
			it.each([
				{ trait: ZWBFTraitsEnum.INFERTILE, traitCalls: [true, false, false], expected: 0 },
				{ trait: ZWBFTraitsEnum.FERTILE, traitCalls: [false, true, false], expected: 1  },
				{ trait: ZWBFTraitsEnum.HYPERFERTILE, traitCalls: [false, false, true], expected: 1 },
				{ trait: undefined, traitCalls: [false, false, false], expected: Womb.chances.get('Ovulation') },
			])("Fertility should be $expected when player has trait $trait", ({ traitCalls, expected}) => {
				const womb = new Womb();
				const [isInfertile, isFertile, isHyperfertile] = traitCalls;
				const player = mockedPlayer({
					HasTrait: jest.fn()
						.mockImplementationOnce(() => isInfertile)
						.mockImplementationOnce(() => isFertile)
						.mockImplementation(() => isHyperfertile)
				});
				womb.onCreatePlayer(player);
				womb.onPregnancyUpdate({ isPregnant: false, progress: 0 });
				womb.onEveryMinute();
				expect(womb.fertility).toBe(expected);
			});
			
			// TODO: fix the following test
			it("Fertility should be 0 when pregnant", () => {
				const womb = new Womb();
				const player = mockedPlayer();
				womb.onCreatePlayer(player);
				womb.onPregnancyUpdate({ isPregnant: true, progress: 0.5 });
				womb.onEveryMinute();
				expect(womb.fertility).toBe(0);
			});
		});
});