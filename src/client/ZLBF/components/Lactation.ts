import { BodyPartType, IsoPlayer, triggerEvent, ZombRand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { LactationData, LactationImage as LactationImages, PregnancyData } from "@types";
import { percentageToNumber } from "@utils";
import { ZLBFEventsEnum, ZLBFTraitsEnum } from "@constants";
import { LactationOptions } from "@client/SandboxOptions";
import { Player, TimedEvents } from "./Player";
import { Moodle } from "./Moodles";

/**
 * Lactation management system for a player character.
 * Handles milk production, expiration, pregnancy influence,
 * and visual image resolution based on state.
 */
export class Lactation extends Player<LactationData> implements TimedEvents {
	private readonly _bottleAmount  = 0.2;

	private moodle?: Moodle;

	private readonly CONSTANTS = {
		MAX_LEVEL: 5,
		AMOUNTS: {
			MIN: 0.02,
			MAX: 0.1
		}
	};

	private readonly options = {
		expiration: LactationOptions.expiration,
		capacity: LactationOptions.capacity
	}

	/**
	 * Debug utilities to modify internal milk data
	 */
	public Debug = {
		add: (amount: number) => (this.milkAmount += amount),
		remove: (amount: number) => (this.milkAmount -= amount),
		set: (amount: number) => (this.milkAmount = amount),
		toggle: (status: boolean) => this.toggle(status)
	};

	defaultData = {
		isActive: false,
		milkAmount: 0,
		expiration: this.options.expiration,
		multiplier: 0
	};

	constructor() {
		super("ZLBFLactation");
	}

	onCreatePlayer(player: IsoPlayer): void {
		super.onCreatePlayer(player);
		this.moodle = new Moodle({
			player,
			name: "Engorgement",
			type: "Bad",
			texture: "media/ui/Moodles/Engorgement.png",
			tresholds: [0.3, 0.6, 0.8, 0.9]
		});

		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyTenMinutes.addListener(() => this.onEveryTenMinutes());
		Events.everyHours.addListener(() => this.onEveryHour());
	}

	onPregnancyUpdate(data: PregnancyData) {
		super.onPregnancyUpdate(data);
		if (!this.pregnancy) return;

		const { progress } = this.pregnancy;
		if (progress < 0.5) return;
		this.toggle(true);
		this.useMilk(0, progress);
	}

	onEveryMinute() {
		triggerEvent(ZLBFEventsEnum.LACTATION_UPDATE, this.data);
	}

	onEveryTenMinutes() {
		if (!this.isLactating) return;

		const modifier = percentageToNumber(this.percentage, 25);
		
		this.applyBodyEffect(BodyPartType.Torso_Upper, {
			pain: modifier,
			maxPain: 10,
			wetness: modifier
		});

		// Apply moodle
		this.moodle?.moodle(this.percentage);
	}

	onEveryHour() {
		if (!this.isLactating) return;

		const amount = ZombRand(this.CONSTANTS.AMOUNTS.MIN, this.CONSTANTS.AMOUNTS.MAX);
		const multiplier = 1 + this.multiplier;

		this.milkAmount = Math.min(this.capacity, this.milkAmount + amount * multiplier);
		this.multiplier = Math.max(0, this.multiplier - 0.1);
		this.expiration = Math.max(0, this.expiration - 1);

		if (this.expiration === 0) this.toggle(false);
	}

	/**
	 * Toggles lactation on or off and resets data if needed
	 */
	public toggle(status: boolean) {
		this.isLactating = status;
		this.expiration = this.options.expiration;
		if (!status) {
			this.data = {
				isActive: false,
				expiration: this.options.expiration,
				milkAmount: 0,
				multiplier: 0
			};
		}
	}

	/**
	 * Uses milk, applies multipliers based on traits
	 * @param amount - amount of milk to use
	 * @param multiplier - additional production multiplier
	 * @param expiration - override expiration value
	 */
	public useMilk(amount: number, multiplier?: number) {
		if (!this.data) return;

		amount = Math.min(amount, this.milkAmount);
		this.multiplier = Math.max(0, multiplier || 0);
		this.expiration = this.options.expiration;

		if (this.hasTrait(ZLBFTraitsEnum.DAIRY_COW)) {
			this.multiplier *= 1.25;
			this.expiration *= 1.25;
		}

		this.remove(amount);
	}

	/**
	 * Removes milk amount ensuring it doesn't go below 0
	 */
	private remove(amount: number) {
		this.milkAmount = Math.max(0, this.milkAmount - amount);
	}

	/**
	 * Gets the lactation image set depending on state
	 */
	get images(): LactationImages {
		const getState = () => {
			const progress = this.pregnancy?.progress ?? 0;
			if (progress < 0.4) return "normal";
			return `pregnant_${progress < 0.7 ? "early" : "late"}`;
		};

		const state = getState();
		const fullness = this.milkAmount > this.capacity / 2 ? "full" : "empty";
		const level = percentageToNumber(this.percentage, this.CONSTANTS.MAX_LEVEL);

		return {
			breasts: `media/ui/lactation/boobs/color-${this.skinColorIndex}/${state}_${fullness}.png`,
			level: `media/ui/lactation/level/milk_level_${level}.png`
		};
	}

	/** Milk percentage relative to capacity */
	get percentage() {
		return (this.milkAmount / this.capacity) * 100;
	}

	set isLactating(value: boolean) {
		this.data!.isActive = value;
	}
	/** Is the player currently lactating? */
	get isLactating() {
		return this.data?.isActive ?? false;
	}

	/** Maximum milk capacity */
	private get capacity() {
		return this.options.capacity;
	}

	/** Bottleable milk amount */
	get bottleAmount() {
		return this._bottleAmount;
	}

	/** Milk storage */
	private set milkAmount(amount: number) {
		this.data!.milkAmount = amount;
	}
	get milkAmount() {
		return this.data?.milkAmount ?? 0;
	}

	/** Multiplier that affects production */
	private set multiplier(value: number) {
		this.data!.multiplier = value;
	}
	get multiplier() {
		return this.data!.multiplier;
	}

	/** Time until spoilage in hours */
	private set expiration(value: number) {
		if (this.hasTrait(ZLBFTraitsEnum.DAIRY_COW)) {
			this.data!.expiration = value * 1.25;
		}
		this.data!.expiration = value;
	}
	private get expiration() {
		return this.data!.expiration;
	}
}
