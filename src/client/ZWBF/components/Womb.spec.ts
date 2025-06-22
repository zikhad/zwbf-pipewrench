import { mock } from "jest-mock-extended";
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { WombData } from "../../../types";
import { Womb } from "./Womb";
import * as SpyUtils from "../Utils";
import { ZWBFTraitsEnum } from "../../../constants";
import { Player } from "./Player";

import * as Events from "@asledgehammer/pipewrench-events";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");

jest.mock("./Player");
jest.mock("@utils", () => ({
	...jest.requireActual("@utils"),
	Inventory: {
		hasItem: jest.fn()
	}
}));

// === Helpers ===

const mockedPlayer = (overrides: Partial<IsoPlayer> = {}) => mock<IsoPlayer>(overrides);

const mockedModData = (overrides: Partial<WombData> = {}): WombData => ({
	amount: 200,
	total: 400,
	cycleDay: 1,
	fertility: 0,
	onContraceptive: true,
	chances: Womb.chances,
	...overrides
});

const mockDataGetter = (data: Partial<WombData> = {}) =>
	jest.spyOn(Player.prototype, "data", "get")
		.mockReturnValue(mockedModData(data));

const setupWombWithPlayer = (
	traitMap: Partial<Record<ZWBFTraitsEnum, boolean>> = {},
	dataOverrides: Partial<WombData> = {}
): Womb => {
	const player = mockedPlayer({
		HasTrait: (trait: string) => traitMap[trait as ZWBFTraitsEnum] ?? false
	});

	// mockDataGetter(dataOverrides);

	const womb = new Womb();
	womb.onCreatePlayer(player);
	return womb;
};

// TODO: fix those tests
describe("Womb", () => {
	
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();

		// Reset the EventEmitter mock to a working state
		const mockAddListener = jest.fn();
		const mockEventEmitter = {
			addListener: mockAddListener
		};
		jest.spyOn(Events, 'EventEmitter').mockReturnValue(mockEventEmitter as any);
	});

	describe("without player or data", () => {
		
		beforeEach(() => {
			jest.spyOn(Player.prototype, "pregnancy", "get")
				.mockReturnValue(null);
			jest.spyOn(Player.prototype, "data", "get")
				.mockReturnValue(null);
		});
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
		it("Pregnancy should be null", () => {
			const womb = new Womb();
			womb.onPregnancyUpdate({ progress: 0 });
			expect(womb.pregnancy).toBeNull();
		});
	});

	describe("Event Emitter setup", () => {
		it("should setup animation update event listener on player creation", () => {
			// Mock the EventEmitter
			const mockAddListener = jest.fn();
			const mockEventEmitter = {
				addListener: mockAddListener
			};
			
			// Spy on EventEmitter constructor
			jest.spyOn(Events, 'EventEmitter').mockReturnValue(mockEventEmitter as any);
			
			const womb = new Womb();
			const player = mockedPlayer();
			
			// Call onCreatePlayer to trigger the event emitter setup
			womb.onCreatePlayer(player);
			
			// Verify EventEmitter was created with correct type
			expect(Events.EventEmitter).toHaveBeenCalledWith("ZWBFAnimationUpdate");
			
			// Verify addListener was called
			expect(mockAddListener).toHaveBeenCalledTimes(1);
			expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
			
			// Test that the listener function works correctly
			const listenerFn = mockAddListener.mock.calls[0][0];
			const testAnimationData = { isActive: true, delta: 0.5, duration: 1000 };
			
			// Call the listener function
			listenerFn(testAnimationData);
			
			// Verify it updates the womb's animation
			expect(womb.animation).toEqual(testAnimationData);
		});
	});

	describe("With player & data are defined", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get")
				.mockReturnValue(mockedModData());
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

		it.each([
			{ day: 0, phase: "Recovery" },
			{ day: 1, phase: "Menstruation" },
			{ day: 12, phase: "Follicular" },
			{ day: 15, phase: "Ovulation" },
			{ day: 17, phase: "Luteal" }
		])("The cycle should be $phase when cycle day is $day", ({ day, phase }) => {
			jest.spyOn(Player.prototype, "data", "get")
				.mockReturnValue(mockedModData({ cycleDay: day }));
			const womb = new Womb();
			expect(womb.phase).toBe(phase);
		});

		describe("get still Images", () => {
			it.each([
				{ amount: 0, expected: "womb_normal_0.png" },
				{ amount: 1, expected: "womb_normal_1.png" },
				{ amount: 1000, expected: "womb_normal_17.png" }
			])("Image should be $expected if sperm amount is $amount", ({ amount, expected }) => {
				jest.spyOn(Player.prototype, "data", "get")
					.mockReturnValue(mockedModData({ amount }));
				const womb = new Womb();
				expect(womb.image).toBe(`media/ui/womb/normal/${expected}`);
			});
		});

		describe("get scene Images", () => {
			it.each([
				{
					amount: 0,
					isPregnant: false,
					condom: false,
					expected: "media/ui/animation/normal/empty/0.png"
				},
				{
					amount: 0,
					isPregnant: false,
					condom: true,
					expected: "media/ui/animation/condom/0.png"
				},
				{
					amount: 900,
					isPregnant: false,
					condom: false,
					expected: "media/ui/animation/normal/full/0.png"
				},
				{
					amount: 900,
					isPregnant: false,
					condom: true,
					expected: "media/ui/animation/condom/0.png"
				},
				{
					amount: 0,
					isPregnant: true,
					condom: false,
					expected: "media/ui/animation/pregnant/0.png"
				},
				{
					amount: 0,
					isPregnant: true,
					condom: true,
					expected: "media/ui/animation/condom/0.png"
				},
				{
					amount: 900,
					isPregnant: true,
					condom: false,
					expected: "media/ui/animation/pregnant/0.png"
				},
				{
					amount: 900,
					isPregnant: true,
					condom: true,
					expected: "media/ui/animation/condom/0.png"
				}
			])(
				"Should return $expected when pregnancy: $isPregnant, condom: $condom and amount: $amount",
				({ isPregnant, condom, amount, expected }) => {
					jest.spyOn(SpyUtils.Inventory, "hasItem").mockReturnValue(condom);
					
					jest.spyOn(Player.prototype, "data", "get")
						.mockReturnValue(mockedModData({ amount }));

					jest.spyOn(Player.prototype, 'pregnancy', 'get')
						.mockReturnValue(isPregnant ? { progress: 0.6 } : null);
					const womb = new Womb();
					womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });
					expect(womb.image).toBe(expected);
				}
			);

			it("should return labor animation", () => {
				jest.spyOn(SpyUtils.Inventory, "hasItem").mockReturnValue(false);
				jest.spyOn(Player.prototype, 'pregnancy', 'get')
					.mockReturnValue({ progress: 1, isInLabor: true });
				const womb = new Womb();
				// womb.onPregnancyUpdate({ isPregnant: true, progress: 1, isInLabor: true });
				womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });
				expect(womb.image).toBe("media/ui/animation/birth/0.png");
			});
		});

		describe("Pregnancy", () => {
			it.each([
				{ pregnancy: false, progress: 0, phase: "Menstruation" },
				{ pregnancy: true, progress: 0.5, phase: "Pregnant" }
			])(
				"Cycle phase should be $phase if pregnancy is $pregnant",
				({ pregnancy, progress, phase }) => {
					
					jest.spyOn(Player.prototype, 'pregnancy', 'get')
						.mockReturnValue(pregnancy ? { progress } : null);
					const womb = new Womb();
					expect(womb.phase).toBe(phase);
				}
			);

			it("amount should be 0 if pregnancy progress is > 0.5", () => {
				jest.spyOn(Player.prototype, 'pregnancy', 'get')
					.mockReturnValue({ progress : 0.6 });
				const womb = new Womb();
				expect(womb.amount).toBe(200);
				womb.onPregnancyUpdate({ progress : 0.6 });
				expect(womb.amount).toBe(0);
			});

			it.each([
				{
					progress: 0,
					amount: 0,
					expected: "conception/womb_conception_0.png"
				},
				{
					progress: 0,
					amount: 1000,
					expected: "conception/womb_conception_17.png"
				},
				{
					progress: 0.8,
					amount: 1000,
					expected: "pregnant/womb_pregnant_4.png"
				},
				{
					progress: 0.95,
					amount: 1000,
					expected: "pregnant/womb_pregnant_6.png"
				}
			])(
				"still image should be $expected when progress is $progress and amount is $amount",
				({ progress, amount, expected }) => {
					jest.spyOn(Player.prototype, 'pregnancy', 'get')
						.mockReturnValue({ progress });
					
					jest.spyOn(Player.prototype, "data", "get")
						.mockReturnValue(mockedModData({ amount }));
					
						const womb = new Womb();
					womb.onPregnancyUpdate({ progress : expect.any(Number) });
					expect(womb.image).toBe(`media/ui/womb/${expected}`);
				}
			);
		});
	});

	// TODO: fix this test
	describe("Fertility", () => {
		it.each([
			{ traits: { [ZWBFTraitsEnum.INFERTILE]: true }, expected: 0 },
			{ traits: { [ZWBFTraitsEnum.FERTILE]: true }, expected: 1 },
			{ traits: { [ZWBFTraitsEnum.HYPERFERTILE]: true }, expected: 1 },
			{ traits: {}, expected: 0.85 }
		])("Fertility should be $expected for traits $traits", ({ traits, expected }) => {
			jest.spyOn(Player.prototype, "data", "get")
				.mockReturnValue(mockedModData({ cycleDay: 15, onContraceptive: false }));
			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer({
				HasTrait: (trait: string) => traits[trait as never] ?? false
			}));
			// womb.onPregnancyUpdate({  progress: 0 });
			womb.onEveryMinute();
			expect(womb.fertility).toBe(expected);
		});

		it("Fertility should be 0 when pregnant", () => {
			jest.spyOn(Player.prototype, "data", "get")
				.mockReturnValue(mockedModData())
			jest.spyOn(Player.prototype, "pregnancy", "get")
				.mockReturnValue({ progress: 0.5 });
			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
			// womb.onPregnancyUpdate({ progress: expect.any(Number) });
			womb.onEveryMinute();
			expect(womb.fertility).toBe(0);
		});
	});
});
