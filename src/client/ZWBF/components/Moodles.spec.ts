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
		const getMoodle = jest.fn(() => ({
			setThresholds: jest.fn(),
			setPicture: jest.fn(),
			getGoodBadNeutral: jest.fn(),
			getLevel: jest.fn(),
			setValue: jest.fn()
		}));
		beforeEach(() => {
			Object.defineProperty(SpyPipewrench, "require", {
				value: jest.fn(),
				writable: true
			});
			(globalThis as any).MF = {
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
				const spy = jest.spyOn(SpyPipewrench.HaloTextHelper, "addText");
				const moodle = new Moodle({
					name: "TestMoodle",
					player,
					texture: "test_texture.png",
					type,
					tresholds: [0, 0.25, 0.5, 0.75]
				});
				moodle.moodle(0.5);
				expect(spy).toHaveBeenCalled();
			}
		);
	});
});
