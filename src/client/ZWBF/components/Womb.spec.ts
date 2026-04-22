/* eslint-disable @typescript-eslint/no-explicit-any */
import { BodyPartType } from "@asledgehammer/pipewrench";
import * as SpyPipeWrench from "@asledgehammer/pipewrench";
import { CyclePhase, WombData } from "@types";
import { Womb } from "./Womb";
import { CyclePhaseEnum, ZWBFEventsEnum, ZWBFTraitsEnum } from "@constants";
import { Player } from "./Player";
import * as Events from "@asledgehammer/pipewrench-events";
import { mockedPlayer } from "@test/mock";

// === Mocks ===
jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench/client");
jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./Player");

const mockedModData = (overrides: Partial<WombData> = {}): WombData => ({
	capacity: 1,
	amount: 0.2,
	total: 0.4,
	cycleDay: 1,
	fertility: 0,
	onContraceptive: true,
	chances: {
		[CyclePhaseEnum.PREGNANT]: 0,
		[CyclePhaseEnum.RECOVERY]: 0,
		[CyclePhaseEnum.MENSTRUATION]: 0.2,
		[CyclePhaseEnum.FOLLICULAR]: 0.3,
		[CyclePhaseEnum.OVULATION]: 0.85,
		[CyclePhaseEnum.LUTEAL]: 0.2
	},
	...overrides
});

// === Test Suite ===
describe("Womb", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
		jest.restoreAllMocks();

		// Setup default EventEmitter mock
		const mockAddListener = jest.fn();
		const mockEventEmitter = { addListener: mockAddListener };
		jest.spyOn(Events, "EventEmitter").mockReturnValue(mockEventEmitter as any);

		// Default: no pregnancy, no data
		jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(null);
		jest.spyOn(Player.prototype, "data", "get").mockReturnValue(null);

	});

	// === Basic Instantiation Tests ===
	describe("Instantiation", () => {
		describe("without player data", () => {
			// No need for beforeEach, already set at top-level

			it("should instantiate with default values", () => {
				const womb = new Womb();

				expect(womb.amount).toBe(0);
				expect(womb.total).toBe(0);
				expect(womb.cycleDay).toBe(0);
				expect(womb.fertility).toBe(0);
				expect(womb.contraceptive).toBe(false);
				expect(womb.phase).toBe("Recovery");
			});
		});

		describe("with player data", () => {
			beforeEach(() => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());
			});

			it("should instantiate with provided data", () => {
				const womb = new Womb();
				womb.onCreatePlayer(mockedPlayer());

				expect(womb.amount).toBe(0.2);
				expect(womb.total).toBe(0.4);
				expect(womb.cycleDay).toBe(1);
				expect(womb.fertility).toBe(0);
				expect(womb.contraceptive).toBe(true);
				expect(womb.phase).toBe(CyclePhaseEnum.MENSTRUATION);
			});
		});
	});

	// === Event System Tests ===
	describe("Event System", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());
		});
		describe("Timer events", () => {
			describe.each([
				{ event: "everyOneMinute", handler: "onEveryMinute" },
				{ event: "everyTenMinutes", handler: "onEveryTenMinutes" },
				{ event: "everyDays", handler: "onEveryDay" }
			])("For $event", ({ event, handler }) => {
				const mockEventListener = jest.fn();
				let womb: Womb;
				beforeEach(() => {
					mockEventListener.mockClear();
					(Events as any)[event] = {
						addListener: mockEventListener
					};
					const player = mockedPlayer();
					womb = new Womb();
					(womb as any)[handler] = jest.fn();
					womb.onCreatePlayer(player);
				});
				it(`should register ${event} listener during player creation`, () => {
					expect(mockEventListener).toHaveBeenCalledWith(expect.any(Function));
				});
				it(`should call ${event} method when event fires`, () => {
					const spy = jest.spyOn(womb as any, handler);
					const [callback] = mockEventListener.mock.calls[0];
					callback();
					expect(spy).toHaveBeenCalled();
				});
			});
			it("Should remove sperm periodically", () => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
					mockedModData({ amount: 0.1 })
				);
				jest.spyOn(SpyPipeWrench, "ZombRand")
					.mockReturnValue(10);

				const womb = new Womb();
				womb.onCreatePlayer(mockedPlayer());

				(womb as any).onEveryTenMinutes();
				(womb as any).onEveryMinute();

				expect(womb.amount).toBeCloseTo(0.09);
			});
			it("should not apply wetness if there is no sperm left", () => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
					mockedModData({ amount: 0 })
				);
				const womb = new Womb();
				const spy = jest.spyOn(womb as any, "applyWetness");
				(womb as any).onEveryTenMinutes();
				expect(spy).not.toHaveBeenCalled();
			});
		});
		describe("Custom events", () => {
			const mockAddListener = jest.fn();
			beforeEach(() => {
				mockAddListener.mockClear();

				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
					mockedModData({ amount: 0, total: 0 })
				);

				(Events.EventEmitter as jest.Mock).mockImplementation(() => ({
					addListener: mockAddListener
				}));
			});
			describe("Intercourse", () => {
				it("should call intercourse via event Listener", () => {
					const womb = new Womb();
					womb.onCreatePlayer(mockedPlayer());

					// The intercourse is the first EventEmitter call
					const [listenerFn] = mockAddListener.mock.calls[0];
					const spyIntercourse = jest.spyOn(womb as any, "intercourse");

					listenerFn();
					expect(spyIntercourse).toHaveBeenCalled();
				});
				it.each([
					{ condom: true, impregnate: false },
					{ condom: false, impregnate: true }
				])(
					"when player has condom: $condom impregnate should be called: $impregnate",
					({ condom, impregnate }) => {
						jest.spyOn(Player.prototype, "hasItem").mockReturnValue(condom);
						const player = mockedPlayer({
							getInventory: jest.fn().mockImplementation(() => ({
								Remove: jest.fn(),
								AddItem: jest.fn()
							}))
						});
						const womb = new Womb();
						const spyIpregnate = jest.spyOn(womb as any, "impregnate");

						womb.onCreatePlayer(player);
						(womb as any).intercourse();
						if (impregnate) {
							expect(spyIpregnate).toHaveBeenCalled();
						} else {
							expect(spyIpregnate).not.toHaveBeenCalled();
						}
					}
				);
			});
		});
	});

	// === Impregnation mechanics ==
	describe("Impregnate", () => {
	it("should start pregnancy when the random is greater than fertility", () => {
		const womb = new Womb();
		jest.spyOn(womb, "fertility", "get").mockReturnValue(1);
		jest.spyOn(SpyPipeWrench, "ZombRandFloat").mockReturnValue(1);
			(womb as any).impregnate();
			expect(SpyPipeWrench.triggerEvent).toHaveBeenCalledWith(ZWBFEventsEnum.PREGNANCY_START);
		});
	});

	// === Cycle Phase Tests ===
	describe("Cycle Phases", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());
		});

		it.each([
			{ day: 0, phase: CyclePhaseEnum.RECOVERY },
			{ day: 1, phase: CyclePhaseEnum.MENSTRUATION },
			{ day: 12, phase: CyclePhaseEnum.FOLLICULAR },
			{ day: 15, phase: CyclePhaseEnum.OVULATION },
			{ day: 17, phase: CyclePhaseEnum.LUTEAL }
		])("should return $phase when cycle day is $day", ({ day, phase }) => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ cycleDay: day })
			);

			const womb = new Womb();
			expect(womb.phase).toBe(phase);
		});

		it.each([
			{ pregnancy: false, progress: 0, phase: CyclePhaseEnum.MENSTRUATION },
			{ pregnancy: true, progress: 0.5, phase: CyclePhaseEnum.PREGNANT }
		])(
			"should return $phase when pregnancy is $pregnancy",
			({ pregnancy, progress, phase }) => {
				jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
					pregnancy ? { progress } : null
				);

				const womb = new Womb();
				expect(womb.phase).toBe(phase);
			}
		);
	});

	// === Timer Events Tests ===
	describe("Timer Events", () => {
		describe("onEveryDay", () => {
			let mockChances: Record<CyclePhase, number>;
			let chancesSpy: jest.SpyInstance;

			beforeEach(() => {
				mockChances = {
					"Pregnant": 0,
					"Recovery": 0,
					"Menstruation": 0.2,
					"Follicular": 0.3,
					"Ovulation": 0.85,
					"Luteal": 0.2
				};
				chancesSpy = jest.spyOn(Womb, "chances", "get").mockReturnValue(mockChances);
			});

			afterEach(() => {
				chancesSpy.mockRestore();
			});

			it("should update chances DAILY when data exists", () => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());

				const womb = new Womb();
				chancesSpy.mockClear();

				womb.onCreatePlayer(mockedPlayer());
				(womb as any).menstruationEffects = jest.fn();
				womb.onEveryDay();

				expect(chancesSpy).toHaveBeenCalledTimes(1);

				expect(womb.data?.chances).toEqual(mockChances);
			});
		});
		describe("onEveryMinute", () => {
			it("should update minute data and trigger WOMB_UPDATE with full data including capacity", () => {
				const data = mockedModData({ cycleDay: 15, onContraceptive: false });
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(data);
				const womb = new Womb();
				womb.onCreatePlayer(mockedPlayer());
				womb.onEveryMinute();
				expect(SpyPipeWrench.triggerEvent).toHaveBeenCalledWith(
					ZWBFEventsEnum.WOMB_UPDATE,
					expect.objectContaining({
						capacity: expect.any(Number),
						amount: expect.any(Number),
						total: expect.any(Number),
					})
				);
			});
		});
	});

	// === Capacity Tests ===
	describe("Capacity", () => {
		it("should return data.capacity if it exists", () => {
			const customCapacity = 5;
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ capacity: customCapacity })
			);
			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
			expect(womb.capacity).toBe(customCapacity);
		});

		it("should return options.capacity as fallback when data is null", () => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(null);
			const womb = new Womb();
			// capacity should fall back to options.capacity since data is null
			expect(womb.capacity).toBeGreaterThan(0);
		});
	});

	// === Fertility Tests ===
	describe("Fertility", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ cycleDay: 15, onContraceptive: false })
			);
		});

		it.each([
			{ traits: { [ZWBFTraitsEnum.INFERTILE]: true }, expected: 0 },
			{ traits: { [ZWBFTraitsEnum.FERTILE]: true }, expected: 1 },
			{ traits: { [ZWBFTraitsEnum.HYPERFERTILE]: true }, expected: 1 },
			{ traits: {}, expected: 0.85 }
		])("should be $expected for traits $traits", ({ traits, expected }) => {
			const womb = new Womb();
			womb.onCreatePlayer(
				mockedPlayer({
					HasTrait: (trait: string) => traits[trait as never] ?? false
				})
			);

			womb.onEveryMinute();
			expect(womb.fertility).toBe(expected);
		});

		it("should be 0 when pregnant", () => {
			jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue({ progress: 0.5 });

			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
			womb.onEveryMinute();

			expect(womb.fertility).toBe(0);
		});
	});

	// === Pregnancy Tests ===
	describe("Pregnancy", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());
		});

		it("should be null when no pregnancy data", () => {
			jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(null);

			const womb = new Womb();
			womb.onPregnancyUpdate({ progress: 0 });

			expect(womb.pregnancy).toBeNull();
		});

		it("should reset amount to 0 when pregnancy progress > 0.5", () => {
			jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue({ progress: 0.6 });

			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
			expect(womb.amount).toBe(0.2);

			womb.onPregnancyUpdate({ progress: 0.6 });
			expect(womb.amount).toBe(0);
		});
	});

	// === Menstruation ===
	describe("Menstruation", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());

			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ cycleDay: 1 })
			);
		});

		it.each([
			{ trait: ZWBFTraitsEnum.STRONG_MENSTRUAL_CRAMPS, expectedPain: 10 },
			{ trait: ZWBFTraitsEnum.NO_MENSTRUAL_CRAMPS, expectedPain: 0 },
			{ trait: null, expectedPain: 5 }
		])(
			"should call apply damage with pain of $expectedPain when player has trait of $trait",
			({ trait, expectedPain }) => {
				const womb = new Womb();

				const spyApplyDamage = jest.spyOn(womb as any, "applyBodyEffect");

				womb.onCreatePlayer(
					mockedPlayer({
						HasTrait: (_trait: string) => _trait === trait
					})
				);
				womb.onEveryDay();

				expect(womb.phase).toBe(CyclePhaseEnum.MENSTRUATION);

				if (trait === ZWBFTraitsEnum.NO_MENSTRUAL_CRAMPS) {
					expect(spyApplyDamage).not.toHaveBeenCalled();
				} else {
					expect(spyApplyDamage).toHaveBeenCalledWith(BodyPartType.Groin, expect.objectContaining({ pain: expectedPain }));
				}
			}
		);

		it("should not apply menstruation effects outside menstruation phase", () => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ cycleDay: 5 })
			);

			const womb = new Womb();
			const menstruationEffectsSpy = jest.spyOn(womb as any, "menstruationEffects");
			womb.onEveryDay();

			expect(womb.phase).not.toBe(CyclePhaseEnum.MENSTRUATION);
			expect(menstruationEffectsSpy).not.toHaveBeenCalled();
		});
	});

	// === External getters & setters ===
	describe("External getters & setters", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ onContraceptive: false, cycleDay: 1 })
			);
		});
		it("should be able to set contraceptive externally", () => {
			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
			expect(womb.contraceptive).toBe(false);
			womb.contraceptive = true;
			expect(womb.contraceptive).toBe(true);
		});
		it("Should be able to retrieve phaseTranslation", () => {
			const womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
			expect(womb.phaseTranslation).toBe("IGUI_ZWBF_UI_Menstruation");
		});
	});

	// === Debug Functions ===
	describe("Debug", () => {
		let womb: Womb;
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ amount: 0, total: 0, cycleDay: 1 })
			);
			womb = new Womb();
			womb.onCreatePlayer(mockedPlayer());
		});
		describe("sperm", () => {
			it.each<{ method: "add" | "set" | "remove"; expected: number }>([
				{ method: "add", expected: 0.01 },
				{ method: "set", expected: 0.01 },
				{ method: "remove", expected: 0 }
			])(
				"when method $method is called, the expected amount should be $expected",
				({ method, expected }) => {
					womb.Debug.sperm[method](0.01);
					expect(womb.amount).toBeCloseTo(expected);
				}
			);
			it("when method setTotal is called, the total should be set", () => {
				womb.Debug.sperm.setTotal(0.01);
				expect(womb.total).toBeCloseTo(0.01);
			});
		});
		describe("cycle", () => {
			it("should add a cycleDay", () => {
				womb.Debug.cycle.addDay();
				expect(womb.cycleDay).toBe(2);
			});
			it.each([
				{ cycleDay: 0, expectedDay: 1 },
				{ cycleDay: 5, expectedDay: 6 },
				{ cycleDay: 12, expectedDay: 13 },
				{ cycleDay: 15, expectedDay: 16 },
				{ cycleDay: 27, expectedDay: 28 },
				{ cycleDay: 28, expectedDay: 1 }
			])(
				"when player is not pregnant and cycleDay is $cycleDay, expected day when calling nextPhase should be $expectedDay",
				({ cycleDay, expectedDay }) => {
					jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
						mockedModData({ cycleDay })
					);
					womb.Debug.cycle.nextPhase();
					expect(womb.cycleDay).toBe(expectedDay);
				}
			);
			it("when player is pregnant, Debug.Cycle.nextPhase should do nothing", () => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
					mockedModData({ cycleDay: 0 })
				);
				jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue({ progress: 0.5 });

				womb.Debug.cycle.nextPhase();

				expect(womb.cycleDay).toBe(0);
			});
		});
	});
});
