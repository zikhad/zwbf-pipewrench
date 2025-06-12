import { getText, TraitFactory } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

export enum ZWBFTraits {
	INFERTILE = "Infertile",
	FERTILE = "Fertile",
	HYPERFERTILE = "Hyperfertile",
	PREGNANCY = "Pregnancy",
	DAIRY_COW = "DairyCow",
	STRONG_MENSTRUAL_CRAMPS = "StrongMenstrualCramps",
	NO_MENSNTRUAL_CRAMPS = "NoMenstrualCramps"
}

type TraitType = {
	id: ZWBFTraits;
	cost: number;
	profession?: boolean,
	exclusives?: ZWBFTraits[]
}

export class TraitsClass {
	private readonly traits: TraitType[];
	private readonly defaultTraits: TraitType[] = [
		/** Infertile trait [3]: You are infertile. You cannot get pregnant  */
		{
			id: ZWBFTraits.INFERTILE,
			cost: 3,
			exclusives: [ZWBFTraits.FERTILE, ZWBFTraits.HYPERFERTILE, ZWBFTraits.PREGNANCY] 
		},
		/** Fertile [-2]: You are very fertile <br>- Higher chance of getting pregnant <br>- +50% fertility */
		{
			id: ZWBFTraits.FERTILE,
			cost: -2,
			exclusives: [ZWBFTraits.HYPERFERTILE]
		},
		/**  -- Fertile trait [-2]: You are very fertile. Higher chance of getting pregnant +50% fertility  */
		{
			id: ZWBFTraits.HYPERFERTILE,
			cost: -6
		},
		/** Pregnancy [-8]: Starts the game pregnant */
		{
			id: ZWBFTraits.PREGNANCY,
			cost: -8
		},
		/** Dairy Cow [-4]: Increases milk production rate (+25%) and time lactating (+25%). */
		{
			id: ZWBFTraits.DAIRY_COW,
			cost: 4
		},
		{
			id: ZWBFTraits.STRONG_MENSTRUAL_CRAMPS,
			cost: -1,
			exclusives: [ZWBFTraits.NO_MENSNTRUAL_CRAMPS]
		},
		{
			id: ZWBFTraits.NO_MENSNTRUAL_CRAMPS,
			cost: 1
		},
	];
	constructor(traits?: TraitType[]) {
		this.traits = traits || this.defaultTraits;
		Events.onGameBoot.addListener(() => this.addTraits());
	}
	private addTraits() {
		for (const { id, cost, profession = false, exclusives = [] } of this.traits) {
			const name = getText(`UI_Trait_${id}`);
			const description = getText(`UI_Trait_${id}_Description`);
			TraitFactory.addTrait(
				id,
				name,
				cost,
				description,
				profession
			);
			for (const exclusive of exclusives) {
				TraitFactory.setMutualExclusive(id, exclusive);
			}
		}
	}
}