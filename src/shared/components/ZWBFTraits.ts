import { getText } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { TraitRegister } from "./TraitRegister";
import { TraitType } from "types";

export class ZWBFTraits {
	private readonly traits: TraitType[];
	private readonly traitRegister: TraitRegister;
	private readonly defaultTraits: TraitType[] = [
		/** Infertile trait [3]: You are infertile. You cannot get pregnant  */
		{
			id: "zwbf:infertile",
			cost: 3,
			exclusives: ["zwbf:fertile", "zwbf:hyperfertile", "zwbf:pregnancy"],
			translationKey: "Infertile"
		},
		/** Fertile [-2]: You are very fertile <br>- Higher chance of getting pregnant <br>- +50% fertility */
		{
			id: "zwbf:fertile",
			cost: -2,
			exclusives: ["zwbf:hyperfertile"],
			translationKey: "Fertile"
		},
		/**  -- Fertile trait [-2]: You are Hyper fertile. Higher chance of getting pregnant +50% fertility  */
		{
			id: "zwbf:hyperfertile",
			cost: -6,
			translationKey: "Hyperfertile"
		},
		/** Pregnancy [-8]: Starts the game pregnant */
		{
			id: "zwbf:pregnancy",
			cost: -8,
			translationKey: "Pregnancy"
		},
		/** Dairy Cow [-4]: Increases milk production rate (+25%) and time lactating (+25%). */
		{
			id: "zwbf:dairycow",
			cost: 4,
			translationKey: "DairyCow"
		},
		{
			id: "zwbf:strongmenstrualcramps",
			cost: -1,
			exclusives: ["zwbf:nomenstrualcramps"],
			translationKey: "StrongMenstrualCramps"
		},
		{
			id: "zwbf:nomenstrualcramps",
			cost: 1,
			translationKey: "NoMenstrualCramps"
		}
	];
	constructor(traits?: TraitType[], traitRegister: TraitRegister = TraitRegister.create()) {
		this.traits = traits || this.defaultTraits;
		this.traitRegister = traitRegister;

		Events.onCreateLivingCharacter.addListener(() => this.addTraits());
	}

	/**
	 * Adds traits to the TraitFactory.
	 * This method is called when a living character is created.
	 */
	private addTraits() {
		if (!this.traitRegister.isAvailable()) {
			return;
		}

		for (const { id, cost, profession = false, translationKey } of this.traits) {
			const key = translationKey || id;
			const name = getText(`UI_Trait_${key}`);
			const description = getText(`UI_Trait_${key}_Description`);
			this.traitRegister.addTrait(id, name, cost, description, profession);
		}
		this.setMultualExclusive();
	}

	/**
	 * Sets mutual exclusives for traits.
	 * This method iterates through the traits and sets mutual exclusives using the TraitFactory.
	 */
	private setMultualExclusive() {
		if (!this.traitRegister.isAvailable()) {
			return;
		}

		for (const { id, exclusives = [] } of this.traits) {
			for (const exclusive of exclusives) {
				this.traitRegister.setMutualExclusive(id, exclusive);
			}
		}
	}
}
