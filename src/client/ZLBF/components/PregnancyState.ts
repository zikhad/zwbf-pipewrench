import { IsoPlayer } from "@asledgehammer/pipewrench";
import { ZLBFTraitsEnum } from "@constants";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";
import type { PregnancyData } from "@types";
import { ModData } from "@client/components/ModData";

const DEFAULT_PREGNANCY_DATA: PregnancyData = {
	current: 0,
	progress: 0,
	isInLabor: false
};

export class PregnancyState {
	private static readonly modKey = "ZLBFPregnancy";

	private static getStore(player: IsoPlayer): ModData<PregnancyData> {
		return new ModData<PregnancyData>({
			object: player,
			modKey: this.modKey,
			defaultData: DEFAULT_PREGNANCY_DATA
		});
	}

	public static initialize(player: IsoPlayer): void {
		this.getStore(player);
	}

	public static get(player?: IsoPlayer): PregnancyData | null {
		if (!player) return null;
		if (!CharacterTraitApi.hasTrait(player, ZLBFTraitsEnum.PREGNANCY)) return null;
		const data = this.getStore(player).data ?? null;
		return data;
	}

	public static set(player: IsoPlayer | undefined, value: PregnancyData): void {
		if (!player) return;
		this.getStore(player).data = value;
	}
}