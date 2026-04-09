/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsoPlayer, ArrayList } from "@asledgehammer/pipewrench";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { mock } from "jest-mock-extended";
import { Effects } from "./Effects";
import { mockedPlayer } from "@test/mock";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@asledgehammer/pipewrench-events");

describe("Effects", () => {
	const addListener = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Events, "EventEmitter").mockReturnValue({ addListener } as any);
	});

	describe("ZomboWin Defeat deactivated", () => {
		beforeEach(() => {
			jest.spyOn(SpyPipewrench, "getActivatedMods").mockImplementation(() =>
				mock<ArrayList>({
					contains: () => false
				})
			);
		});
		it("Should NOT call WOMB_HOURLY_UPDATE", () => {
			new Effects();
			expect(addListener).not.toHaveBeenCalled();
		});
	});

	describe("ZomboWin Default Enabled", () => {
		const setInfectionLevel = jest.fn();
		const getStat = jest.fn();
		const setStat = jest.fn();
		const getStats = jest.fn().mockImplementation(() => ({
			set: setStat,
			get: getStat
		}));
		beforeEach(() => {
			getStat.mockReset();
			setStat.mockReset();
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
				callback({
					player: mock(),
					amount: mock(),
					capacity: mock(),
				});
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
					const player = mockedPlayer({
						getBodyDamage: jest.fn().mockImplementation(() => ({
							setInfectionLevel
						}))
					});
					(player.getCharacterTraits().get as any).mockReturnValue(trait);
					const effects = new Effects();
					(effects as any).ZWUnblessing(player, amount);
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
					const player = mockedPlayer({
						getStats
					});
					(player.getCharacterTraits().get as any).mockReturnValue(trait);
					getStat.mockReturnValue(0.5);
					const effects = new Effects();
					(effects as any).ZWSuccubus(player, amount);
					expected();
				}
			);
		});
	});
});
