import { getActivatedMods, getPlayer, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { MODS, ZWBFEventsEnum } from "@constants";
import { WombData } from "@types";
import { percentageToNumber } from "@utils";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";

export class Effects {
	constructor() {
		if (!getActivatedMods().contains(MODS.ZOMBOWIN_DEFEAT)) return;

		new Events.EventEmitter<( data: WombData ) => void>(
			ZWBFEventsEnum.WOMB_UPDATE
		).addListener(({ amount,  capacity }) => {
			const player = getPlayer();
			this.ZWUnblessing(player, amount);
			this.ZWSuccubus(player, amount, capacity);
		});
	}

	/**
	 * Sexperiment trait, make infection 0 8 when sperm is present in the womb
	 */
	private ZWUnblessing(player: IsoPlayer, amount: number) {
		if (!CharacterTraitApi.hasTrait(player, "unblessing") || amount <= 0) return;
		player.getBodyDamage().setInfectionLevel(0);
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
	private ZWSuccubus(player: IsoPlayer, amount: number, capacity: number) {
		if (!CharacterTraitApi.hasTrait(player, "succubus") || amount <= 0) return;
		const stats = player.getStats();
		const fullness = amount / capacity;
		const modifier = percentageToNumber(fullness * 100, 0.3);

		stats.set(CharacterStat.HUNGER, Math.max(0, stats.get(CharacterStat.HUNGER) - modifier));
		stats.set(CharacterStat.FATIGUE, Math.max(0, stats.get(CharacterStat.FATIGUE) - modifier));
		stats.set(
			CharacterStat.ENDURANCE,
			Math.max(1, stats.get(CharacterStat.ENDURANCE) + modifier)
		);
	}
}
