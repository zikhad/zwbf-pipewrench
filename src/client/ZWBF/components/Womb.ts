import { AnimationStatus, CyclePhase, PregnancyData, WombData } from "@types";
import {
	BodyPartType,
	getText,
	IsoPlayer,
	triggerEvent,
	ZombRand,
	ZombRandFloat
} from "@asledgehammer/pipewrench";
import { WombOptions } from "@client/SandboxOptions";
import * as Events from "@asledgehammer/pipewrench-events";
import { Player, TimedEvents } from "./Player";
import { percentageToNumber } from "@utils";
import { CyclePhaseEnum, ZWBFEventsEnum, ZWBFTraitsEnum } from "@constants";
import { ISTimedActionQueue } from "@asledgehammer/pipewrench/client";

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

/**
 * Manages reproductive functions, fertility, and pregnancy-related animations
 * for a player character in the game. Handles cycle tracking, fertility logic,
 * and dynamic image rendering for different states.
 */
export class Womb extends Player<WombData> implements TimedEvents {

	private readonly options = {
		recovery: WombOptions.recovery,
		capacity: WombOptions.capacity
	};

	private _animation: AnimationStatus;
	
	private readonly animations: AnimationSettings;
	
	public amount = 0;

	public Debug = {
		sperm: {
			add: (amount: number) => {
				this.amount = Math.min(this.options.capacity, this.amount + amount);
				this.total += amount;
			},
			remove: (amount: number) => (this.amount = Math.max(0, this.amount - amount)),
			set: (amount: number) => (this.amount = amount),
			setTotal: (amount: number) => (this.total = Math.max(0, amount))
		},
		cycle: {
			addDay: (amount = 1) => {
				this.cycleDay = Math.max(1, (this.cycleDay + amount) % 29);
				this.contraceptive = false;
			},
			nextPhase: () => {
				if (this.pregnancy) return;
				if (this.cycleDay < 1) {
					this.cycleDay = 1;
				} else if (this.cycleDay < 6) {
					this.cycleDay = 6;
				} else if (this.cycleDay < 13) {
					this.cycleDay = 13;
				} else if (this.cycleDay < 16) {
					this.cycleDay = 16;
				} else if (this.cycleDay < 28) {
					this.cycleDay = 28;
				} else {
					this.cycleDay = 1;
				}
				this.contraceptive = false;
			}
		}
	};

	defaultData = {
		amount: 0,
		total: 0,
		cycleDay: ZombRand(1, 28),
		onContraceptive: false,
		chances: Womb.chances,
		fertility: 0
	};

	// === Property Accessors ===

	/**
	 * Generates randomized fertility chances for each cycle phase.
	 */
	static get chances(): Record<CyclePhase, number> {
		return {
			[CyclePhaseEnum.PREGNANT]: 0,
			[CyclePhaseEnum.RECOVERY]: 0,
			[CyclePhaseEnum.MENSTRUATION]: ZombRandFloat(0, 0.3),
			[CyclePhaseEnum.FOLLICULAR]: ZombRandFloat(0, 0.4),
			[CyclePhaseEnum.OVULATION]: ZombRandFloat(0.85, 1),
			[CyclePhaseEnum.LUTEAL]: ZombRandFloat(0, 0.3),
		};
	}

	set contraceptive(value: boolean) {
		this.data!.onContraceptive = value;
	}
	
	get contraceptive() {
		return this.data?.onContraceptive ?? false;
	}

	set cycleDay(value: number) {
		this.data!.cycleDay = value;
	}

	get cycleDay() {
		return this.data?.cycleDay ?? 0;
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

	get phase() {
		return this.getCyclePhase(this.cycleDay);
	}

	get phaseTranslation() {
		return {
			[CyclePhaseEnum.RECOVERY]: "IGUI_ZWBF_UI_Recovery",
			[CyclePhaseEnum.MENSTRUATION]: "IGUI_ZWBF_UI_Menstruation",
			[CyclePhaseEnum.FOLLICULAR]: "IGUI_ZWBF_UI_Follicular",
			[CyclePhaseEnum.OVULATION]: "IGUI_ZWBF_UI_Ovulation",
			[CyclePhaseEnum.LUTEAL]: "IGUI_ZWBF_UI_Luteal",
			[CyclePhaseEnum.PREGNANT]: "IGUI_ZWBF_UI_Pregnant"
		}[this.phase];
	}

	set animation(value: AnimationStatus) {
		this._animation = value;
	}

	get animation() {
		return this._animation;
	}

	/**
	 * Initializes the Womb system with animation presets.
	 */
	constructor() {
		super("ZWBFWomb");
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
		super.onCreatePlayer(player);
		this.amount = this.data?.amount ?? 0;

		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyTenMinutes.addListener(() => this.onEveryTenMinutes());
		Events.everyHours.addListener(() => this.onEveryHour());
		Events.everyDays.addListener(() => this.onEveryDay());

		new Events.EventEmitter<(data: AnimationStatus) => void>(
			ZWBFEventsEnum.ANIMATION_UPDATE
		).addListener(data => this.onAnimationUpdate(data));

		new Events.EventEmitter(ZWBFEventsEnum.INTERCOURSE).addListener(() => this.intercourse());
	}

	private isAllowedAnimation(
		excludedTags: string[] = ["Oral", "Masturbation", "Anal", "Solo", "Mast"]
	) {
		// when in labor, there is no need to check ZomboWin animations
		if (this.pregnancy?.isInLabor) return true;

		const getAnim = () => {
			const { queue }: { queue: { animation: string }[] } = ISTimedActionQueue.getTimedActionQueue(this.player);

			return queue[0]?.animation ?? null;
			/* if (queue.length > 0) {
				const { animation } = queue[0];
				return animation;
			}
			return null; */
		};

		const getAnimInfo = () => {
			const currentAnim = getAnim();
			if (!currentAnim) return null;

			for (const data of ZomboWinAnimationData) {
				for (const { stages } of data.actors) {
					const { perform } = stages[0];
					if (perform == currentAnim) {
						return data;
					}
				}
			}
			return null;
		};

		const tags = getAnimInfo()?.tags;
		if (!tags) return false;
		return !tags.some(tag => excludedTags.includes(tag));
	}

	/**
	 * Applies animation updates to internal state.
	 * @param data - New animation status.
	 */
	public onAnimationUpdate(data: AnimationStatus) {
		this.animation = data;
		if (!this.isAllowedAnimation()) {
			this.animation = {
				isActive: false
			};
		}
	}

	private intercourse() {
		if (!this.player) return;
		const amountInMilliliters = ZombRand(10, 50);
		const amount = amountInMilliliters / 1000;
		this.haloText({
			text: `${getText("IGUI_ZWBF_UI_Sperm")} ${amountInMilliliters} ml`,
			style: "good",
		});
		if (this.hasItem("ZWBF.Condom")) {
			const inventory = this.player.getInventory();
			inventory.Remove("Condom");
			inventory.AddItem("ZWBF.CondomUsed");
		} else {
			this.amount += amount;
			this.total += amount;
			this.impregnate();
		}
	}

	private impregnate() {
		if (this.fertility <= 0) return;
		if (ZombRandFloat(0, 1) >= 1 - this.fertility) {
			this.haloText({
				text: getText("IGUI_ZWBF_UI_Fertilized"),
				style: "good"
			});
			triggerEvent(ZWBFEventsEnum.PREGNANCY_START);
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
		this.fertility = this.computeFertility();
		if(this.data) this.data.amount = this.amount;
	}

	onEveryTenMinutes(): void {
		// do nothing if empty
		if(this.amount <= 0) return;

		const amount = ZombRand(0, 50) / 1000;
		this.amount -= Math.min(this.amount, amount);
		this.applyWetness();
	}

	onEveryHour(): void {
		triggerEvent(ZWBFEventsEnum.WOMB_HOURLY_UPDATE, {
			player: this.player,
			amount: this.amount,
			capacity: this.options.capacity
		});
	}

	onEveryDay(): void {
		// Increment cycle day
		this.cycleDay++;

		// Remove contraceptive effect
		this.contraceptive = false;

		this.data!.chances = Womb.chances;
		if (
			this.phase == CyclePhaseEnum.MENSTRUATION &&
			!this.hasZWBFTrait(ZWBFTraitsEnum.NO_MENSTRUAL_CRAMPS)
		) {
			this.menstruationEffects();
		}
	}

	private computeFertilityBonus() {
		if (this.hasZWBFTrait(ZWBFTraitsEnum.FERTILE)) return 0.25;
		if (this.hasZWBFTrait(ZWBFTraitsEnum.HYPERFERTILE)) return 0.5;
		return 0;
	}

	/**
	 * Computes fertility value based on traits and state.
	 * @returns Fertility chance between 0 and 1.
	 */
	private computeFertility() {
		const isInfetile = this.hasZWBFTrait(ZWBFTraitsEnum.INFERTILE);
		if (
			!this.data ||
			isInfetile ||
			this.contraceptive ||
			this.pregnancy
		) {
			return 0;
		}

		const chance = this.data.chances[this.phase];
		const bonus = this.computeFertilityBonus();

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

	/** Applies bleeding effects */
	private applyBleeding() {
		const maxPain = this.hasZWBFTrait(ZWBFTraitsEnum.STRONG_MENSTRUAL_CRAMPS)
			? 50
			: 25;
		const groin = this.getBodyPart(BodyPartType.Groin)!;
		const pain = groin.getAdditionalPain();
		const bleedTime = groin.getBleedingTime();
		groin.setBleedingTime(Math.min(10, bleedTime));
		groin.setAdditionalPain(Math.max(maxPain, pain + ZombRand(0, maxPain)));
	}
	
	/** Applies wetness effects */
	private applyWetness() {
		const amount = ZombRand(10, 100);
		const groin = this.getBodyPart(BodyPartType.Groin)!;
		groin.setWetness(groin.getWetness() + amount);
	}

	/** Apply menstrual effects like bleeding and pain */
	private menstruationEffects() {
		this.applyBleeding();
	}

	/**
	 * Builds image path for non-animated state.
	 */
	private getStillImage(): string {
		const pregnancy = this.pregnancy;
		const getStatus = () => {
			if (!pregnancy) return "normal";
			if (pregnancy.progress > 0.05) return "pregnant";
			return "conception";
		};

		const getImageIndex = () => {
			if (pregnancy && pregnancy.progress > 0.05) {
				return percentageToNumber(
					(pregnancy.progress > 0.9 ? 1 : pregnancy.progress) * 100,
					6
				);
			}
			if (this.amount === 0) return 0;			
			const percentage = Math.floor((this.amount / this.options.capacity) * 100);
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
		return this.getStillImage();
	}
}
