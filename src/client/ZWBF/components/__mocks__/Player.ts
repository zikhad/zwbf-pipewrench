/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { PregnancyData } from "../../../../types";
import { ZWBFTraitsEnum } from "@constants";
export class Player<T = unknown> {
	public player?: IsoPlayer;
	public _data?: T;

	public _pregnancy?: PregnancyData;
	public defaultData?: T;

	constructor() {}

	onCreatePlayer(player: IsoPlayer) {
		this.player = player;
	}
	onPregnancyUpdate() {}

	hasZWBFTrait(trait: ZWBFTraitsEnum) {
		return Player.hasZWBFTrait(this.player, trait);
	}

	addZWBFTrait(trait: ZWBFTraitsEnum) {
		const player = this.player;
		if (!player) return;

		const traits = player.getTraits();
		if (player.HasTrait(trait)) return;
		traits.add(trait);
	}

	removeZWBFTrait(trait: ZWBFTraitsEnum) {
		const player = this.player;
		if (!player) return;

		const traits = player.getTraits();
		if (player.HasTrait(trait)) traits.remove(trait);
	}

	static hasZWBFTrait(player: IsoPlayer | undefined, trait: ZWBFTraitsEnum) {
		if (!player) return false;
		return player.HasTrait(trait);
	}

	getBodyPart(arg: never) {
		return null as never;
	}

	hasItem(arg: never): boolean {
		return null as never;
	}

	haloText(...args: never[]) {}

	get skinColorIndex() {
		return 0;
	}

	get data() {
		return null as never;
	}

	set data(value: T) {}

	get pregnancy() {
		return null as never;
	}
	set pregnancy(value: PregnancyData) {}
}
