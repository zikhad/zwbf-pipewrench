/* @noSelfInFile */

import { AnimationStatus, CyclePhase, PregnancyData, WombData } from "@types";
import { BodyPartType, getText, IsoPlayer, triggerEvent, ZombRand, ZombRandFloat } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { Player, TimedEvents } from "./Player";
import { percentageToNumber } from "@utils";
import { CyclePhaseEnum, ZWBFEvents, ZWBFTraitsEnum } from "@constants";

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
export class Womb extends Player<WombData>implements TimedEvents {
	private readonly _capacity: number;

	private readonly options: WombOptions;

	private _animation: AnimationStatus;

	private readonly animations: AnimationSettings;
	
	public Debug = {
		sperm: {
			add: (amount: number) => {
				this.amount = Math.min(this._capacity, this.amount + amount)
				this.total += amount;
			},
			remove: (amount: number) => this.amount = Math.max(0, this.amount - amount),
			set: (amount: number) => this.amount = amount,
			setTotal: (amount: number) => this.total = Math.max(0, amount),
		},
		cycle: {
			addDay: (amount = 1) => this.cycleDay = Math.min(28, this.cycleDay + amount),
			nextPhase: () => {
				if (this.pregnancy) return;
				if(this.cycleDay < 1) {
					this.cycleDay = 1;
				} else if (this.cycleDay < 6) {
					this.cycleDay = 6;
				} else if (this.cycleDay < 13) {
					this.cycleDay = 13
				} else if (this.cycleDay < 16) {
					this.cycleDay = 16
				} else if (this.cycleDay < 28) {
					this.cycleDay = 28
				} else {
					this.cycleDay = 1;
				}
			}
		}
	}

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
					[0, 1, 2, 3, 4, 3, 2, 1],
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

		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyTenMinutes.addListener(() => this.onEveryTenMinutes());
		Events.everyHours.addListener(() => this.onEveryHour())
		Events.everyDays.addListener(() => this.onEveryDay());

		new Events.EventEmitter<(data: AnimationStatus) => void>(ZWBFEvents.ANIMATION_UPDATE)
			.addListener(
				data => this.onAnimationUpdate(data)
			);
		
		new Events.EventEmitter(ZWBFEvents.INTERCOURSE)
			.addListener(() => this.intercourse());
	}

	/**
	 * Applies animation updates to internal state.
	 * @param data - New animation status.
	 */
	onAnimationUpdate(data: AnimationStatus) {
		this.animation = data;
	}

	intercourse() {
		if (this.hasItem("ZWBF.Condom")) {
			const inventory = this.player?.getInventory()
			inventory?.Remove("Condom");
			inventory?.AddItem("ZWBF.CondomUsed", 1);
		} else {
			const amount = ZombRand(10, 50);
			this.amount += amount;
			this.total += amount;
			
			this.haloText({
				text: `${getText("IGUI_ZWBF_UI_Sperm")} ${amount} ml`,
				arrow: "up",
				color: "green"
			});

			this.impregnate();
		}
	}

	impregnate() {
		const fertility = this.getFertility();
		if (fertility <= 0) return;
		if (ZombRandFloat(0, 1) >= (1 - fertility)) {
			// TODO: Add Halo text
			this.haloText({
				text: getText("IGUI_ZWBF_UI_Fertilized"),
				color: "green"
			})
			triggerEvent(ZWBFEvents.PREGNANCY_START);
		}
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

	onEveryMinute(): void {
		this.fertility = this.getFertility();
	}

	onEveryTenMinutes(): void {
		// 50% of doing nothing also do nothing if empty
		if ((ZombRand(100) < 50) || (this.amount <= 0)) return;
		const amount = ZombRand(10, 50);
		this.amount -= Math.min(this.amount, amount);
		this.applyWetness();
	}

	onEveryHour(): void {
		this.data!.chances = Womb.chances;
	}

	onEveryDay(): void {
		
		// Increment cycle day
		this.cycleDay++;

		if (this.phase != CyclePhaseEnum.MENSTRUATION) return;
		if (this.player?.HasTrait(ZWBFTraitsEnum.NO_MENSNTRUAL_CRAMPS)) return;

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
		};

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

	
	private applyBleeding() {
		const maxPain = this.player?.HasTrait(ZWBFTraitsEnum.STRONG_MENSTRUAL_CRAMPS) ? 50 : 25;
		const groin = this.getBodyPart(BodyPartType.Groin)!;
		const pain = groin.getAdditionalPain();
		const bleedTime = groin.getBleedingTime();
		groin.setBleedingTime(Math.min(10, bleedTime));
		groin.setAdditionalPain(Math.max(maxPain, pain + ZombRand(maxPain)));
	}
	private applyWetness() {
		const amount = ZombRand(10,100);
		const groin = this.getBodyPart(BodyPartType.Groin)!;
		groin.setWetness(groin.getWetness() + amount);
	}
	
	/** Apply menstrual effects like bleeding and pain */
	private menstruationEffects() {
		if (ZombRand(100) < 50) return;
		this.applyBleeding();
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

	set contraceptive(value: boolean) {
		this.data!.onContraceptive = value;
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

	set total(value: number) {
		this.data!.total = value;
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

	/**
	 * Builds image path for non-animated state.
	 */
	private stillImage(): string {
		const pregnancy = this.pregnancy;
		const getStatus = () => {
			if (!pregnancy) return "normal";
			if (pregnancy.progress > 0.05) return "pregnant";
			return "conception";
		};

		const getImageIndex = () => {
			if (pregnancy && pregnancy?.progress > 0.05) {
				return percentageToNumber(
					(pregnancy.progress > 0.9 ? 1 : pregnancy.progress) * 100,
					6
				);
			}
			if (this.amount === 0) return 0;
			const percentage = Math.floor((this.amount / this._capacity) * 100);
			const index = percentageToNumber(percentage, 17);
			return Math.max(1, index);
		};

		const status = getStatus();
		const imageIndex = getImageIndex();

		return `media/ui/womb/${status}/womb_${status}_${imageIndex}.png`;
	}

	/**
	 * Gets the animation type and corresponding settings.
	 */
	private getAnimationSetting(): { animation: AnimationSettings[string]; type: string } {
		if (this.hasItem("ZWBF.Condom")) {
			return {
				animation: this.animations["condom"],
				type: "condom"
			};
		} else if (this.pregnancy?.isInLabor) {
			return {
				animation: this.animations["birth"],
				type: "birth"
			};
		} else if ((this.pregnancy?.progress || 0) > 0.5) {
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
		const { duration = 1, delta = 0 } = this.animation;
		const { animation, type } = this.getAnimationSetting();
		const { steps, loop = 1 } = animation;

		const loopDuration = (duration / loop);
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
