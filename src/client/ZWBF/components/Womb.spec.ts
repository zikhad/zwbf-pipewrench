/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { BodyPart } from "@asledgehammer/pipewrench";
import * as SpyPipeWrench from "@asledgehammer/pipewrench";
import { ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { CyclePhase, WombData } from "@types";
import { Womb } from "./Womb";
import { CyclePhaseEnum, ZWBFEvents, ZWBFTraitsEnum } from "@constants";
import { Player } from "./Player";
import * as Events from "@asledgehammer/pipewrench-events";
import { mockedPlayer } from "@test/mock";

// === Mocks ===
jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench/client");
jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./Player");

const mockedModData = (overrides: Partial<WombData> = {}): WombData => ({
	amount: 200,
	total: 400,
	cycleDay: 1,
	fertility: 0,
	onContraceptive: true,
	chances: new Map([
		[CyclePhaseEnum.RECOVERY, 0],
		[CyclePhaseEnum.MENSTRUATION, 0.2],
		[CyclePhaseEnum.FOLLICULAR, 0.3],
		[CyclePhaseEnum.OVULATION, 0.85],
		[CyclePhaseEnum.LUTEAL, 0.2]
	]),
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

		// getTimedActionQueue should always return an valid value
		ISTimedActionQueue.getTimedActionQueue = jest.fn().mockImplementation(() => ({
			queue: [{ animation: "allowed" }]
		}));

		// should mock ZomboWin animation data
		const ZomboWinAnimationData = [
			{
				prefix: "mocked",
				id: "mocked",
				tags: ["allowed"],
				actors: [
					{ gender: "Female", stages: [{ perform: "allowed", duration: 1000 }] },
					{ gender: "Male", stages: [{ perform: "allowed", duration: 1000 }] }
				]
			}
		];
		Object.defineProperty(global, "ZomboWinAnimationData", {
			value: ZomboWinAnimationData,
			writable: true
		});
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
				expect(womb.onContraceptive).toBe(false);
				expect(womb.phase).toBe("Recovery");
				expect(womb.image).toBe("");
			});
		});

		describe("with player data", () => {
			beforeEach(() => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());
			});

			it("should instantiate with provided data", () => {
				const womb = new Womb();

				expect(womb.amount).toBe(200);
				expect(womb.total).toBe(400);
				expect(womb.cycleDay).toBe(1);
				expect(womb.fertility).toBe(0);
				expect(womb.onContraceptive).toBe(true);
				expect(womb.phase).toBe(CyclePhaseEnum.MENSTRUATION);
			});
		});
	});

	// === Event System Tests ===
	describe("Event System", () => {
		describe("Timer events", () => {
			describe.each([
				{ event: "everyOneMinute", handler: "onEveryMinute" },
				{ event: "everyTenMinutes", handler: "onEveryTenMinutes" },
				{ event: "everyHours", handler: "onEveryHour" },
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
					mockedModData({ amount: 100 })
				);
				jest.spyOn(Player.prototype, "getBodyPart").mockReturnValue(mock<BodyPart>());
				const womb = new Womb();
				// womb.onCreatePlayer(mockedPlayer());
				(womb as any).onEveryTenMinutes();
				expect(womb.amount).toBe(90);
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
			describe("Animation", () => {
				it("should setup animation update event listener on player creation", () => {
					const womb = new Womb();
					womb.onCreatePlayer(mockedPlayer());

					const [listenerFn] = mockAddListener.mock.calls[0];
					const testAnimationData = { isActive: true, delta: 0.5, duration: 1000 };

					listenerFn(testAnimationData);
					expect(womb.animation).toEqual(testAnimationData);
				});
			});

			describe("Intercourse", () => {
				it("should call intercourse via event Listener", () => {
					const womb = new Womb();
					womb.onCreatePlayer(mockedPlayer());

					// The intercourse is the second call of the Event.Emitter
					const [listenerFn] = mockAddListener.mock.calls[1];
					const spyIntercourse = jest.spyOn(womb as any, "intercourse");

					listenerFn();
					expect(spyIntercourse).toHaveBeenCalled();
				});
				it.each([
					{ condom: true, impregnate: false },
					{ condom: false, impregnate: true }
				])(
					"when player has condom is $condom should impregnate should be $impregnate",
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
		test("should start pregnancy when the random is greater than fertility", () => {
			const womb = new Womb();
			jest.spyOn(womb as any, "getFertility").mockReturnValue(1);
			jest.spyOn(SpyPipeWrench, "ZombRand").mockReturnValue(1);
			(womb as any).impregnate();
			expect(SpyPipeWrench.triggerEvent).toHaveBeenCalledWith(ZWBFEvents.PREGNANCY_START);
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
		describe("onEveryHour", () => {
			let mockChances: Map<CyclePhase, number>;
			let chancesSpy: jest.SpyInstance;

			beforeEach(() => {
				mockChances = new Map([
					["Recovery", 0],
					["Menstruation", 0.2],
					["Follicular", 0.3],
					["Ovulation", 0.9],
					["Luteal", 0.2]
				]);
				chancesSpy = jest.spyOn(Womb, "chances", "get").mockReturnValue(mockChances);
			});

			afterEach(() => {
				chancesSpy.mockRestore();
			});

			it("should update chances when data exists", () => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());

				const womb = new Womb();
				chancesSpy.mockClear();

				womb.onEveryHour();

				expect(chancesSpy).toHaveBeenCalledTimes(1);
				expect(womb.data!.chances).toBe(mockChances);
			});
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
			expect(womb.amount).toBe(200);

			womb.onPregnancyUpdate({ progress: 0.6 });
			expect(womb.amount).toBe(0);
		});
	});

	// === Menstruation ===
	describe("Menstruation", () => {
		const spySetAdditionalPain = jest.fn();
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());

			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
				mockedModData({ cycleDay: 1 })
			);

			const mockBodyPart = mock<BodyPart>({
				getAdditionalPain: jest.fn().mockReturnValue(0),
				setBleedingTime: jest.fn().mockReturnValue(0),
				setAdditionalPain: spySetAdditionalPain
			});

			jest.spyOn(Player.prototype, "getBodyPart").mockReturnValue(mockBodyPart);
		});

		it.each([
			{ trait: ZWBFTraitsEnum.STRONG_MENSTRUAL_CRAMPS, expectedPain: 50 },
			{ trait: ZWBFTraitsEnum.NO_MENSNTRUAL_CRAMPS, expectedPain: 0 },
			{ trait: null, expectedPain: 25 }
		])(
			"should apply pain of $expectedPain when player has trait of $trait",
			({ trait, expectedPain }) => {
				const womb = new Womb();

				const menstruationEffectsSpy = jest.spyOn(womb as any, "menstruationEffects");

				womb.onCreatePlayer(
					mockedPlayer({
						HasTrait: (_trait: string) => _trait === trait
					})
				);
				womb.onEveryDay();

				expect(womb.phase).toBe(CyclePhaseEnum.MENSTRUATION);

				if (trait === ZWBFTraitsEnum.NO_MENSNTRUAL_CRAMPS) {
					expect(menstruationEffectsSpy).not.toHaveBeenCalled();
				} else {
					expect(menstruationEffectsSpy).toHaveBeenCalled();
					expect(spySetAdditionalPain).toHaveBeenCalledWith(expectedPain);
				}
			}
		);

		it("Should not apply menstruation effects depending on chance", () => {
			jest.spyOn(SpyPipeWrench, "ZombRand").mockReturnValue(0);
			const womb = new Womb();
			const spy = jest.spyOn(womb as any, "applyBleeding");
			(womb as any).menstruationEffects();
			expect(spy).not.toHaveBeenCalled();
		});
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

	// === Image Rendering Tests ===
	describe("Image Rendering", () => {
		beforeEach(() => {
			jest.spyOn(Player.prototype, "data", "get").mockReturnValue(mockedModData());
		});

		describe("still images", () => {
			it.each([
				{ amount: 0, expected: "womb_normal_0.png" },
				{ amount: 1, expected: "womb_normal_1.png" },
				{ amount: 1000, expected: "womb_normal_17.png" }
			])("should return $expected when amount is $amount", ({ amount, expected }) => {
				jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
					mockedModData({ amount })
				);

				const womb = new Womb();
				expect(womb.image).toBe(`media/ui/womb/normal/${expected}`);
			});

			it.each([
				{ progress: 0, amount: 0, expected: "conception/womb_conception_0.png" },
				{ progress: 0, amount: 1000, expected: "conception/womb_conception_17.png" },
				{ progress: 0.8, amount: 1000, expected: "pregnant/womb_pregnant_4.png" },
				{ progress: 0.95, amount: 1000, expected: "pregnant/womb_pregnant_6.png" }
			])(
				"should return $expected when pregnant with progress $progress and amount $amount",
				({ progress, amount, expected }) => {
					jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue({ progress });
					jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
						mockedModData({ amount })
					);

					const womb = new Womb();
					womb.onPregnancyUpdate({ progress });

					expect(womb.image).toBe(`media/ui/womb/${expected}`);
				}
			);
		});

		describe("scene images", () => {
			const sceneTestCases = [
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
			];

			it.each(sceneTestCases)(
				"should return $expected when pregnant: $isPregnant, condom: $condom, amount: $amount",
				({ isPregnant, condom, amount, expected }) => {
					jest.spyOn(Player.prototype, "hasItem").mockReturnValue(condom);
					jest.spyOn(Player.prototype, "data", "get").mockReturnValue(
						mockedModData({ amount })
					);
					jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
						isPregnant ? { progress: 0.6 } : null
					);

					const womb = new Womb();
					womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });

					expect(womb.image).toBe(expected);
				}
			);

			it("should return labor animation", () => {
				jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue({
					progress: 1,
					isInLabor: true
				});

				const womb = new Womb();
				womb.onAnimationUpdate({ isActive: true });

				expect(womb.image).toBe("media/ui/animation/birth/0.png");
			});

			it("should not animate when animation is not queued", () => {
				ISTimedActionQueue.getTimedActionQueue = jest.fn().mockImplementation(() => ({
					queue: []
				}));
				const womb = new Womb();
				womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });
				expect(womb.animation.isActive).toBe(false);
			});

			it("should not animate when ZomboWin animation data is not present", () => {
				Object.defineProperty(global, "ZomboWinAnimationData", {
					value: [],
					writable: true
				});
				const womb = new Womb();
				womb.onAnimationUpdate({ isActive: true, delta: 500, duration: 1000 });
				expect(womb.animation.isActive).toBe(false);
			});
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
			expect(womb.onContraceptive).toBe(false);
			womb.contraceptive = true;
			expect(womb.onContraceptive).toBe(true);
		});
		it("Should be able to retrieve phaseTranslation", () => {
			const womb = new Womb();
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
				{ method: "add", expected: 10 },
				{ method: "set", expected: 10 },
				{ method: "remove", expected: 0 }
			])(
				"when method $method is called, the expected amount should be $expected",
				({ method, expected }) => {
					womb.Debug.sperm[method](10);
					expect(womb.amount).toBe(expected);
				}
			);
			it("when method setTotal is called, the total should be set", () => {
				womb.Debug.sperm.setTotal(10);
				expect(womb.total).toBe(10);
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
