/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from "jest-mock-extended";
import { Moodle } from "./Moodles";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { IsoPlayer, ArrayList } from "@asledgehammer/pipewrench";

// jest.mock("MF_ISMoodle");
describe("Moodles", () => {
	const player = mock<IsoPlayer>();
	beforeEach(() => {
		jest.clearAllMocks();
	});
	describe("MoodleFramework is active", () => {
		const createMoodle = jest.fn();
		const moodleNew = jest.fn();
		const texture = { id: "texture" } as any;
		const getMoodle = jest.fn(() => ({
			setThresholds: jest.fn(),
			setPicture: jest.fn(),
			getGoodBadNeutral: jest.fn(() => 1),
			getLevel: jest.fn(() => 2),
			setValue: jest.fn()
		}));
		beforeEach(() => {
			Object.defineProperty(SpyPipewrench, "require", {
				value: jest.fn(),
				writable: true
			});
			Object.defineProperty(SpyPipewrench, "getTexture", {
				value: jest.fn().mockReturnValue(texture),
				writable: true
			});
			(globalThis as any).MF = {
				ISMoodle: { new: moodleNew },
				createMoodle,
				getMoodle
			};
			jest.spyOn(SpyPipewrench, "getActivatedMods").mockImplementation(() =>
				mock<ArrayList>({
					contains: jest.fn().mockImplementation(() => true)
				})
			);
		});
		it.each<{ type: "Good" | "Bad" }>([{ type: "Good" }, { type: "Bad" }])(
			"should create a $type Moodle instance with correct properties",
			({ type }) => {
				const moodle = new Moodle({
					name: "TestMoodle",
					player,
					texture: "test_texture.png",
					type,
					tresholds: [0, 0.25, 0.5, 0.75]
				});
				expect(moodle).toBeDefined();
				expect(createMoodle).toHaveBeenCalledWith("TestMoodle");
			}
		);
		it.each<{ type: "Good" | "Bad" }>([{ type: "Good" }, { type: "Bad" }])(
			"should directly instantiate the MF moodle for the current player on $type creation",
			({ type }) => {
				new Moodle({
					name: "TestMoodle",
					player,
					texture: "test_texture.png",
					type,
					tresholds: [0, 0.25, 0.5, 0.75]
				});
				// Verifies the timing fix: MF.ISMoodle:new is called immediately so the moodle
				// exists even when the constructor runs inside OnCreatePlayer.
				expect(moodleNew).toHaveBeenCalledWith(expect.anything(), "TestMoodle", player);
			}
		);
		it.each<{ type: "Good" | "Bad" }>([{ type: "Good" }, { type: "Bad" }])(
			"Should call MF methods when a $type moodle is call",
			({ type }) => {
				const moodle = new Moodle({
					name: "TestMoodle",
					player,
					texture: "test_texture.png",
					type,
					tresholds: [0, 0.25, 0.5, 0.75]
				});
				moodle.moodle(0.5);
				expect(getMoodle).toHaveBeenCalledWith("TestMoodle");
				expect(getMoodle.mock.results.at(-1)?.value.setPicture).toHaveBeenCalledWith(
					expect.anything(),
					expect.anything(),
					texture
				);
			}
		);
		it("should normalize percentage inputs before passing the value to MF", () => {
			const moodleApi = {
				setThresholds: jest.fn(),
				setPicture: jest.fn(),
				getGoodBadNeutral: jest.fn(() => 2),
				getLevel: jest.fn(() => 1),
				setValue: jest.fn()
			};
			getMoodle.mockReturnValueOnce(moodleApi);

			const moodle = new Moodle({
				name: "Engorgement",
				player,
				texture: "test_texture.png",
				type: "Bad",
				tresholds: [0.3, 0.6, 0.8, 0.9]
			});

			moodle.moodle(28);
			expect(moodleApi.setValue).toHaveBeenCalledWith(0.72);
			expect(moodleApi.setThresholds).toHaveBeenCalledTimes(1);
			const [bad4, bad3, bad2, bad1, good1, good2, good3, good4] = moodleApi.setThresholds.mock.calls[0];
			expect(bad4).toBeCloseTo(0.1);
			expect(bad3).toBeCloseTo(0.2);
			expect(bad2).toBeCloseTo(0.4);
			expect(bad1).toBeCloseTo(0.7);
			expect(good1).toBeUndefined();
			expect(good2).toBeUndefined();
			expect(good3).toBeUndefined();
			expect(good4).toBeUndefined();
		});
		it("should skip picture override when the texture path cannot be resolved", () => {
			Object.defineProperty(SpyPipewrench, "getTexture", {
				value: jest.fn().mockReturnValue(undefined),
				writable: true
			});
			const moodleApi = {
				setThresholds: jest.fn(),
				setPicture: jest.fn(),
				getGoodBadNeutral: jest.fn(() => 1),
				getLevel: jest.fn(() => 2),
				setValue: jest.fn()
			};
			getMoodle.mockReturnValueOnce(moodleApi);

			const moodle = new Moodle({
				name: "TestMoodle",
				player,
				texture: "missing_texture.png",
				type: "Good",
				tresholds: [0, 0.25, 0.5, 0.75]
			});

			moodle.moodle(0.5);
			expect(moodleApi.setPicture).not.toHaveBeenCalled();
			}
		);
	});
	describe("MoodleFramework is inactive", () => {
		beforeEach(() => {
			jest.spyOn(SpyPipewrench, "getActivatedMods").mockImplementation(() =>
				mock<ArrayList>({
					contains: jest.fn().mockImplementation(() => false)
				})
			);
		});
		it.each<{ type: "Good" | "Bad" }>([{ type: "Good" }, { type: "Bad" }])(
			"Should call a HaloText as Fallback for a $type moodle",
			({ type }) => {
				const method = type === "Good" ? "addGoodText" : "addBadText";
				const spy = jest.spyOn(SpyPipewrench.HaloTextHelper, method as "addGoodText" | "addBadText");
				const getTextSpy = jest.spyOn(SpyPipewrench, "getText").mockReturnValue("localized text");
				const moodle = new Moodle({
					name: "TestMoodle",
					player,
					texture: "test_texture.png",
					type,
					tresholds: [0, 0.25, 0.5, 0.75]
				});
				moodle.moodle(0.5);
				expect(spy).toHaveBeenCalled();
				expect(getTextSpy).toHaveBeenCalledWith(`Moodles_TestMoodle_${type}_desc_lvl3`);
			}
		);
	});
});
