/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { mock } from "jest-mock-extended";
import { Pregnancy } from "./Pregnancy";
import { ZWBFTraitsEnum } from "@constants";
import { Player } from "./Player";
import { PregnancyData } from "@types";

jest.mock("@actions/ZWBFBirth");
jest.mock("./Moodles");
jest.mock("./Player");

describe("Pregnancy", () => {
	const player = mock<IsoPlayer>({
		setMaxWeightBase: jest.fn()
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Events, "EventEmitter").mockReturnValue({ addListener: jest.fn() } as any);
	});

	describe("Player is not defined", () => {
		it("Should instantiate", () => {
			const pregnancy = new Pregnancy();
			expect(pregnancy).toBeDefined();
		});
		it("Birth should do nothing", () => {
			const pregnancy = new Pregnancy();
			const spy = jest.spyOn(pregnancy as any, "stop");
			pregnancy.birth();
			expect(spy).not.toHaveBeenCalled();
		});
	});

	// === Event System Tests ===
	describe("Event System", () => {
		describe("Timer Events", () => {
			describe.each([
				{ event: "everyOneMinute", handler: "onEveryMinute" },
				{ event: "everyHours", handler: "onEveryHour" },
				{ event: "everyDays", handler: "onEveryDay" }
			])("For $event", ({ event, handler }) => {
				const addListener = jest.fn();
				let pregnancy: Pregnancy;
				beforeEach(() => {
					addListener.mockClear();
					(Events as any)[event] = { addListener };
					pregnancy = new Pregnancy();
					(pregnancy as any)[handler] = jest.fn();
					(pregnancy as any).onCreatePlayer(player);
				});
				it(`should register ${event} listener during player creation`, () => {
					expect(addListener).toHaveBeenCalledWith(expect.any(Function));
				});
				it(`should call ${event} listener during player creation`, () => {
					const spy = jest.spyOn(pregnancy as any, handler);
					const [callback] = addListener.mock.calls[0];
					callback();
					expect(spy).toHaveBeenCalled();
				});
				it(`Should call ${event} without player`, () => {
					const artifact = new Pregnancy();
					(artifact as any)[handler]();
					expect(artifact).toBeDefined();
				});
			});
			describe("Every minute update", () => {
				describe.each([
					{ current: undefined, isInLabor: false },
					{ current: 1000, isInLabor: false },
					{ current: 1000, isInLabor: true }
				])(
					"Pregnancy progress is $progress and labor is $isInLabor",
					({ current, isInLabor }) => {
						beforeEach(() => {
							jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
								mock<PregnancyData>({ current, isInLabor })
							);
						});
						it("Should call moodle", () => {
							const moodle = jest.fn();
							const pregnancy = new Pregnancy();

							(pregnancy as any).onCreatePlayer(mock<IsoPlayer>());
							(pregnancy as any).moodle = { moodle };
							(pregnancy as any).onEveryMinute();

							expect(moodle).toHaveBeenCalled();
						});
					}
				);
			});
			describe("Every Hour update", () => {
				const setThirst = jest.fn();
				const setCalories = jest.fn();
				let pregnancy: Pregnancy;
				beforeEach(() => {
					pregnancy = new Pregnancy();
					(pregnancy as any).onCreatePlayer({
						...player,
						getStats: () => ({
							setThirst,
							getThirst: () => 0
						}),
						getNutrition: () => ({
							setCalories,
							getCalories: () => 0
						})
					});
				});
				it.each([
					{
						progress: 0,
						expected: () => {
							expect(setThirst).not.toHaveBeenCalled();
							expect(setCalories).not.toHaveBeenCalled();
						}
					},
					{
						progress: 0.5,
						expected: () => {
							expect(setThirst).toHaveBeenCalled();
							expect(setCalories).toHaveBeenCalled();
						}
					}
				])(
					"should call appropriate effects when pregnancy progress is $progres",
					({ progress, expected }) => {
						jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
							mock<PregnancyData>({ progress })
						);

						pregnancy.onEveryHour();

						expected();
					}
				);
			});
			describe("Every Day update", () => {
				const setFoodSicknessLevel = jest.fn();
				let pregnancy: Pregnancy;
				beforeEach(() => {
					pregnancy = new Pregnancy();
					(pregnancy as any).onCreatePlayer({
						...player,
						getBodyDamage: () => ({ setFoodSicknessLevel })
					});
				});

				it.each([
					{
						progress: 0.01,
						expected: () => expect(setFoodSicknessLevel).not.toHaveBeenCalled()
					},
					{
						progress: 0.34,
						expected: () => expect(setFoodSicknessLevel).not.toHaveBeenCalled()
					},
					{
						progress: 0.06,
						expected: () => expect(setFoodSicknessLevel).toHaveBeenCalled()
					}
				])(
					"should call appropriate effects when pregnancy progress is $progress",
					({ progress, expected }) => {
						jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(
							mock<PregnancyData>({ progress })
						);
						pregnancy.onEveryDay();
						expected();
					}
				);
			});
		});
		describe("Custom Events", () => {
			const addListener = jest.fn();
			beforeEach(() => {
				(Events.EventEmitter as jest.Mock).mockImplementation(() => ({
					addListener
				}));
			});
			it("Should start pregnancy", () => {
				const add = jest.fn();

				const pregnancy = new Pregnancy();

				(pregnancy as any).onCreatePlayer({
					...player,
					getTraits: () => ({ add })
				});
				const [callback] = addListener.mock.calls[0];
				callback();
				expect(add).toHaveBeenCalledWith(ZWBFTraitsEnum.PREGNANCY);
			});
		});
	});

	// === Methods ===
	describe("Methods", () => {
		it("Birth should remove Pregnancy trait", () => {
			const remove = jest.fn();
			const AddItem = jest.fn();
			const setBlockMovement = jest.fn();
			const pregnancy = new Pregnancy();
			(pregnancy as any).onCreatePlayer({
				...player,
				setBlockMovement,
				getInventory: () => ({ AddItem }),
				getTraits: () => ({ remove })
			});
			pregnancy.birth();
			expect(remove).toHaveBeenCalled();
		});
	});

	// === Debug Functions ===
	describe("Debug", () => {
		describe("Pregnancy data not defined", () => {
			const start = jest.fn();
			const stop = jest.fn();
			let pregnancy: Pregnancy;
			const spyPregnancySet = jest.spyOn(Player.prototype, "pregnancy", "set");
			beforeEach(() => {
				pregnancy = new Pregnancy();
				(pregnancy as any).options = { duration: 1000 };
				(pregnancy as any).start = start;
				(pregnancy as any).stop = stop;
				// jest.spyOn(Player.prototype, 'pregnancy', 'get').mockReturnValue(null);
			});
			it.each<{
				method: "start" | "stop" | "advance" | "advanceToLabor";
				data: PregnancyData | null;
				args?: number;
				expected: () => void;
			}>([
				{ method: "start", data: null, expected: () => expect(start).toHaveBeenCalled() },
				{ method: "stop", data: null, expected: () => expect(stop).toHaveBeenCalled() },
				{
					method: "advance",
					data: null,
					args: 10,
					expected: () => expect(spyPregnancySet).not.toHaveBeenCalled()
				},
				{
					method: "advanceToLabor",
					data: null,
					expected: () => expect(spyPregnancySet).not.toHaveBeenCalled()
				},
				{
					method: "advance",
					data: mock<PregnancyData>({ current: undefined }),
					args: 10,
					expected: () => expect(spyPregnancySet).toHaveBeenCalled()
				},
				{
					method: "advanceToLabor",
					data: mock<PregnancyData>({ current: undefined }),
					expected: () => expect(spyPregnancySet).toHaveBeenCalled()
				}
			])(
				"Method $method should have expected result when data is $data",
				({ method, data, args, expected }) => {
					jest.spyOn(Player.prototype, "pregnancy", "get").mockReturnValue(data);
					pregnancy.Debug[method](args as never);
					expected();
				}
			);
		});
	});
});
