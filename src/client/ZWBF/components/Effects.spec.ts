/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsoPlayer, ArrayList } from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { WombData } from "@types";
import { mock } from "jest-mock-extended";
import { Effects } from "./Effects";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");

describe("Effects", () => {
	const addListener = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Events, "EventEmitter").mockReturnValue({ addListener } as any);
	});

	describe("Debug Disabled", () => {
		beforeEach(() => {
			jest.spyOn(SpyPipewrench, "getActivatedMods").mockImplementation(() =>
				mock<ArrayList>({
					contains: jest.fn().mockImplementation(() => false)
				})
			);
		});
		it("Should NOT call WOMB_HOURLY_UPDATE", () => {
			expect(addListener).not.toHaveBeenCalled();
		});
	});

	describe("Debug Enabled", () => {
		const setInfectionLevel = jest.fn();
		const getStats = jest.fn().mockImplementation(() => ({
			setHunger: jest.fn(),
			getHunger: jest.fn(),
			setFatigue: jest.fn(),
			getFatigue: jest.fn(),
			setEndurance: jest.fn(),
			getEndurance: jest.fn()
		}));
		beforeEach(() => {
			jest.spyOn(SpyPipewrench, "getActivatedMods").mockImplementation(() =>
				mock<ArrayList>({
					contains: jest.fn().mockImplementation(() => true)
				})
			);
		});

		describe("Instantiation", () => {
			it("Should call WOMB_HOURLY_UPDATE", () => {
				const effects = new Effects();
				(effects as any).ZWUnblessing = jest.fn();
				(effects as any).ZWSuccubus = jest.fn();
				const [callback] = addListener.mock.calls[0];
				callback();
				expect(addListener).toHaveBeenCalledWith(expect.any(Function));
			});
		});

		describe("ZomboWin Unblessing trait", () => {
			it.each([
				{
					trait: true,
					amount: 100,
					expected: () => expect(setInfectionLevel).toHaveBeenCalledWith(0)
				},
				{
					trait: true,
					amount: 0,
					expected: () => expect(setInfectionLevel).not.toHaveBeenCalled()
				},
				{
					trait: false,
					amount: 100,
					expected: () => expect(setInfectionLevel).not.toHaveBeenCalled()
				}
			])(
				"should call (or not) when player has trait is $trait and amount is $amount",
				({ trait, amount, expected }) => {
					const player = mock<IsoPlayer>({
						HasTrait: jest.fn().mockImplementation(() => trait),
						getBodyDamage: jest.fn().mockImplementation(() => ({
							setInfectionLevel
						}))
					});
					const data = mock<WombData>({ amount });
					const effects = new Effects();
					(effects as any).ZWUnblessing(player, data);
					expected();
				}
			);
		});

		describe("ZomboWin Succubus trait", () => {
			it.each([
				{
					trait: true,
					amount: 100,
					expected: () => expect(getStats).toHaveBeenCalled()
				},
				{
					trait: true,
					amount: 0,
					expected: () => expect(getStats).not.toHaveBeenCalled()
				},
				{
					trait: false,
					amount: 100,
					expected: () => expect(getStats).not.toHaveBeenCalled()
				}
			])(
				"Should call (or not) when player has trait is $trait and amount is $amount",
				({ trait, amount, expected }) => {
					const player = mock<IsoPlayer>({
						HasTrait: jest.fn().mockImplementation(() => trait),
						getStats
					});
					const data = mock<WombData>({ amount });
					const effects = new Effects();
					(effects as any).ZWSuccubus(player, data, 1000);
					expected();
				}
			);
		});
	});
});
