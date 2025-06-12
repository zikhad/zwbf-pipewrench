/**  @noSelfInFile */
import { getText, TraitFactory } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

export class ZWBFTraits {
	private readonly traits: TraitType[];
	private readonly defaultTraits: TraitType[] = [
		/** Infertile trait [3]: You are infertile. You cannot get pregnant  */
		{
			id: "Infertile",
			cost: 3,
			exclusives: ["Fertile", "Hyperfertile", "Pregnancy"] 
		},
		/** Fertile [-2]: You are very fertile <br>- Higher chance of getting pregnant <br>- +50% fertility */
		{
			id: "Fertile",
			cost: -2,
			exclusives: ["Hyperfertile"]
		},
		/**  -- Fertile trait [-2]: You are Hyper fertile. Higher chance of getting pregnant +50% fertility  */
		{
			id: "Hyperfertile",
			cost: -6
		},
		/** Pregnancy [-8]: Starts the game pregnant */
		{
			id: "Pregnancy",
			cost: -8
		},
		/** Dairy Cow [-4]: Increases milk production rate (+25%) and time lactating (+25%). */
		{
			id: "DairyCow",
			cost: 4
		},
		{
			id: "StrongMenstrualCramps",
			cost: -1,
			exclusives: ["NoMenstrualCramps"]
		},
		{
			id: "NoMenstrualCramps",
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