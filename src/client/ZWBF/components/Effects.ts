import { getActivatedMods, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZWBFEvents } from "shared/constants";
import { WombData } from "@types";
import { percentageToNumber } from "@utils";

export class Effects {
	constructor() {
		if (!getActivatedMods().contains("ZomboWinDefeatStrip")) return;

		new Events.EventEmitter<(player: IsoPlayer, data: WombData, capacity: number) => void>(
			ZWBFEvents.WOMB_HOURLY_UPDATE
		).addListener((player, data, capacity) => {
			this.ZWUnblessing(player, data);
			this.ZWSuccubus(player, data, capacity);
		});
	}

	/**
	 * Sexperiment trait, make infection 0 8 when sperm is present in the womb
	 */
	private ZWUnblessing(player: IsoPlayer, data: WombData) {
		if (player.HasTrait("unblessing") && data.amount > 0) {
			player.getBodyDamage().setInfectionLevel(0);
		}
	}

	/**
	 * Succucbus trait, if sperm is present in the womb:
	 *
	 * - decrease hunger
	 * - decrease fatigue
	 * - increase endurance
	 *
	 * The more full, more the buff (max 0.3)
	 */
	private ZWSuccubus(player: IsoPlayer, data: WombData, capacity: number) {
		if (!player.HasTrait("succubus") || data.amount <= 0) return;
		const stats = player.getStats();
		const fullness = data.amount / capacity;
		const modifier = percentageToNumber(fullness * 100, 0.3);

		stats.setHunger(Math.max(0, stats.getHunger() - modifier));
		stats.setFatigue(Math.max(0, stats.getFatigue() - modifier));
		stats.setEndurance(Math.max(1, stats.getEndurance() + modifier));
	}
}
