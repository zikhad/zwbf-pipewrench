/* @noSelfInFile */

import { CyclePhase, PregnancyData, WombData } from "@types";
import { BodyPartType, IsoPlayer, ZombRand, ZombRandFloat } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Player } from "./Player";
import { Inventory, percentageToNumber } from "@utils";
import { CyclePhaseEnum, ZWBFTraitsEnum } from "@constants";

/**
 * Describes animation status including whether it's active and the time progress.
 */
type AnimationStatus = {
	isActive: boolean;
	delta: number;
	duration: number;
};

/**
 * Defines settings for animation steps and optional looping.
 */
type AnimationSettings = Record<
	string,
	{
		steps: number[];
		loop?: number;
	}
>;

type WombOptions = {
	recovery: number; // Days to recover after pregnancy
	capacity: number; // Maximum capacity of the womb
};

/**
 * Manages reproductive functions, fertility, and pregnancy-related animations
 * for a player character in the game. Handles cycle tracking, fertility logic,
 * and dynamic image rendering for different states.
 */
export class Womb extends Player<WombData> {
	private readonly _capacity: number;
	
	private readonly options: WombOptions;
	
	private _animation: AnimationStatus;
	
	private readonly animations: AnimationSettings;
	
	/**
	 * Initializes the Womb system with animation presets.
	 */
	constructor() {
		super("ZWBFWomb");
		this.options = {
			recovery: 7,
			capacity: 1000
		};
		this._capacity = this.options.capacity;
		this._animation = {
			isActive: false,
			delta: 0,
			duration: 0
		};
		this.animations = {
			normal: {
				steps: [
					[0, 1, 2, 3, 4, 3, 2, 1],
					[0, 1, 2, 3, 4, 3, 2, 1],
					[0, 1, 2, 3, 4, 3, 2,1],
					[0, 1, 2, 3, 4, 3, 2, 1],
					[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
				].flat()
			},
			pregnant: {
				steps: [
					[0, 1, 2, 3, 2, 1],
					[0, 1, 2, 3, 2, 1],
					[0, 1, 2, 3, 2, 1],
					[0, 1, 2, 3, 2, 1],
					[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
				].flat()
			},
			condom: {
				steps: [0, 1, 2, 3, 4, 5, 6],
				loop: 4
			},
			birth: {
				steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
			}
		};
	}
	
	/**
	 * Initializes data when the player is created.
	 * @param player - The IsoPlayer instance.
	 */
	onCreatePlayer(player: IsoPlayer) {
		const defaultDay = ZombRand(1, 28);
		this.defaultData = {
			amount: 0,
			total: 0,
			cycleDay: defaultDay,
			onContraceptive: false,
			chances: Womb.chances,
			fertility: 0
		};
		super.onCreatePlayer(player);

		Events.onDawn.addListener(() => this.onDawn());

		new Events.EventEmitter<(data: AnimationStatus) => void>("ZWBFAnimationUpdate").addListener(
			data => this.onAnimationUpdate(data)
		);
	}
	
	/**
	 * Applies animation updates to internal state.
	 * @param data - New animation status.
	 */
	onAnimationUpdate(data: AnimationStatus) {
		this.animation = data;
	}
	
	/**
	 * Updates cycle based on pregnancy progress.
	 * @param data - Pregnancy data.
	 */
	onPregnancyUpdate(data: PregnancyData) {
		super.onPregnancyUpdate(data);
		
		if (!this.pregnancy) return;
		
		this.cycleDay = -this.options.recovery;
		if (this.pregnancy.progress > 0.5) {
			this.amount = 0;
		}
	}
	
	/**
	 * Periodic update that recalculates fertility.
	 */
	onEveryMinute(): void {
		this.fertility = this.getFertility();
	}

	onEveryHour(): void {
		if (!this.data) return;
		this.data.chances = Womb.chances;
	}

	onDawn(): void {
		if (!this.data) return;
		
		// Increment cycle day
		this.cycleDay++;

		if(this.phase != CyclePhaseEnum.MENSTRUATION) return;
		if(this.player?.HasTrait(ZWBFTraitsEnum.NO_MENSNTRUAL_CRAMPS)) return;
		
		this.menstruationEffects();
	}
	
	/**
	 * Computes fertility value based on traits and state.
	 * @returns Fertility chance between 0 and 1.
	 */
	private getFertility() {
		const isInfertile = this.player?.HasTrait(ZWBFTraitsEnum.INFERTILE);
		if (!this.data || isInfertile || this.onContraceptive || this.pregnancy) {
			return 0;
		}
		
		const getBonus = () => {
			if (this.player?.HasTrait(ZWBFTraitsEnum.FERTILE)) return 0.25;
			if (this.player?.HasTrait(ZWBFTraitsEnum.HYPERFERTILE)) return 0.5;
			return 0;
		}
		
		const chance = this.data.chances.get(this.phase)!;
		
		const bonus = getBonus();
		
		return Math.min(1, chance * (1 + bonus));
	}
	
	/**
	 * Determines the current cycle phase based on day.
	 * @param day - The current cycle day.
	 */
	private getCyclePhase(day: number): CyclePhase {
		if (this.pregnancy) return CyclePhaseEnum.PREGNANT;
		if (day < 1) return CyclePhaseEnum.RECOVERY;
		if (day < 6) return CyclePhaseEnum.MENSTRUATION;
		if (day < 13) return CyclePhaseEnum.FOLLICULAR;
		if (day < 16) return CyclePhaseEnum.OVULATION;
		return CyclePhaseEnum.LUTEAL;
	}

	/** Apply menstrual effects like bleeding and pain */
	private menstruationEffects() {
		const maxPain = this.player?.HasTrait(ZWBFTraitsEnum.STRONG_MENSTRUAL_CRAMPS) ? 50 : 25;
		const groin = this.getBodyPart(BodyPartType.Groin)!;
		const pain = groin.getAdditionalPain();

		if(ZombRand(100) > 50) {
			const bleedTime = groin.getBleedingTime();
			groin.setBleedingTime(Math.min(10, bleedTime));
			groin.setAdditionalPain(Math.max(maxPain, pain + ZombRand(maxPain)))
		}
	}
	
	// === Property Accessors ===

	/**
	 * Generates randomized fertility chances for each cycle phase.
	 */
	static get chances(): Map<CyclePhase, number> {
		const phases: { phase: CyclePhase; value: number }[] = [
			{ phase: CyclePhaseEnum.RECOVERY, value: 0 },
			{ phase: CyclePhaseEnum.MENSTRUATION, value: ZombRandFloat(0, 0.3) },
			{ phase: CyclePhaseEnum.FOLLICULAR, value: ZombRandFloat(0, 0.4) },
			{ phase: CyclePhaseEnum.OVULATION, value: ZombRandFloat(0.85, 1) },
			{ phase: CyclePhaseEnum.LUTEAL, value: ZombRandFloat(0, 0.3) }
		];
		
		const _chances = new Map<CyclePhase, number>();
		for (const { phase, value } of phases) {
			_chances.set(phase, value);
		}
		
		return _chances;
	}
	
	set cycleDay(value: number) {
		this.data!.cycleDay = value;
	}
	
	get cycleDay() {
		return this.data?.cycleDay ?? 0;
	}
	
	set amount(value: number) {
		this.data!.amount = value;
	}
	
	get amount() {
		return this.data?.amount ?? 0;
	}
	
	get total() {
		return this.data?.total ?? 0;
	}
	
	private set fertility(value: number) {
		this.data!.fertility = value;
	}
	
	get fertility() {
		return this.data?.fertility ?? 0;
	}
	
	get onContraceptive() {
		return this.data?.onContraceptive ?? false;
	}
	
	get phase() {
		return this.getCyclePhase(this.cycleDay);
	}
	
	set animation(value: AnimationStatus) {
		this._animation = value;
	}
	
	get animation() {
		return this._animation;
	}
	
	private stillImage(): string {
		
		const pregnancy = this.pregnancy;
		const getStatus = () => {
			if(!pregnancy) return "normal";
			if (pregnancy.progress > 0.05) return "pregnant";
			return "conception";
		};
		
		const getImageIndex = () => {
			if(pregnancy && pregnancy?.progress > 0.05) {
				return percentageToNumber((pregnancy.progress > 0.9 ? 1 : pregnancy.progress) * 100, 6);
			}
			if (this.amount === 0) return 0;
			const percentage = Math.floor((this.amount / this._capacity) * 100);
			const index = percentageToNumber( percentage, 17 );
			return Math.max(1, index);
		};
		
		const status = getStatus();
		const imageIndex = getImageIndex();
		
		return `media/ui/womb/${status}/womb_${status}_${imageIndex}.png`;
	}	/**
	 * Builds image path for non-animated state.
	 */
	
	
	/**
	 * Gets the animation type and corresponding settings.
	 */
	private getAnimationSetting(): { animation: AnimationSettings[string]; type: string } {
		if (Inventory.hasItem(this.player!, "ZWBF.Condom")) {
			return {
				animation: this.animations["condom"],
				type: "condom"
			};
		} else if (this.pregnancy?.isInLabor) {
			return {
				animation: this.animations["birth"],
				type: "birth"
			};
		} else if ((this.pregnancy?.progress || 0)  > 0.5) {
			return {
				animation: this.animations["pregnant"],
				type: "pregnant"
			};
		}
		return {
			animation: this.animations["normal"],
			type: "normal"
		};
	}
	
	/**
	 * Computes the current animation frame image based on delta and loop settings.
	 */
	private sceneImage(): string {
		const { duration, delta } = this.animation;
		const { animation, type } = this.getAnimationSetting();
		const { steps, loop = 1 } = animation;
		
		const loopDuration = duration / loop;
		const currentLoopDelta = (delta * duration) % loopDuration;
		const stepDuration = loopDuration / steps.length;
		
		const stepIndex = Math.floor(currentLoopDelta / stepDuration) % steps.length;
		const step = steps[stepIndex];
		
		const getFullness = () => {
			if (type !== "normal") return "";
			if (this.amount > this.options.capacity / 2) return "/full";
			return "/empty";
		};
		
		const fullness = getFullness();
		
		return `media/ui/animation/${type}${fullness}/${step}.png`;
	}
	
	/**
	 * Determines the current womb image to render.
	 */
	get image() {
		if (!this.data) return "";
		
		if (this.animation.isActive) return this.sceneImage();
		return this.stillImage();
	}
}
