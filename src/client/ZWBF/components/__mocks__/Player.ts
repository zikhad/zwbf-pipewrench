/* eslint-disable @typescript-eslint/no-unused-vars */
import { BodyPartType, IsoPlayer } from "@asledgehammer/pipewrench";
import { PregnancyData } from "../../../../types";
import { ZWBFTraitsEnum } from "@constants";
export class Player<T = unknown> {
	private static resolveTraitRef(trait: ZWBFTraitsEnum): CharacterTraitRef | undefined {
		return CharacterTrait.get(ResourceLocation.of(trait));
	}

	public player?: IsoPlayer;
	public _data?: T;

	public _pregnancy?: PregnancyData;
	public defaultData?: T;

	constructor() { }

	onCreatePlayer(player: IsoPlayer) {
		this.player = player;
	}
	onPregnancyUpdate() { }

	hasZWBFTrait(trait: ZWBFTraitsEnum) {
		return Player.hasZWBFTrait(this.player, trait);
	}

	addZWBFTrait(trait: ZWBFTraitsEnum) {
		const player = this.player;
		if (!player) return;

		const traits = player.getTraits();
		if (player.HasTrait(trait)) return;
		const traitRef = Player.resolveTraitRef(trait);
		if (!traitRef) return;
		traits.add(traitRef);
	}

	removeZWBFTrait(trait: ZWBFTraitsEnum) {
		const player = this.player;
		if (!player) return;

		const traits = player.getTraits();
		if (player.HasTrait(trait)) {
			const traitRef = Player.resolveTraitRef(trait);
			if (!traitRef) return;
			traits.remove(traitRef);
		}
	}

	static hasZWBFTrait(player: IsoPlayer | undefined, trait: ZWBFTraitsEnum) {
		if (!player) return false;
		return player.HasTrait(trait);
	}

	getBodyPart(arg: never) {
		return null as never;
	}

	applyBodyEffect(part: BodyPartType, options: Partial<{
		pain: number;
		maxPain: number;
		bleedTime: number;
		wetness: number;
	}> = {}) {
		return null as never;
	}

	hasItem(arg: never): boolean {
		return null as never;
	}

	haloText(...args: never[]) { }

	get skinColorIndex() {
		return 0;
	}

	get data() {
		return null as never;
	}

	set data(value: T) { }

	get pregnancy() {
		return null as never;
	}
	set pregnancy(value: PregnancyData) { }
}
