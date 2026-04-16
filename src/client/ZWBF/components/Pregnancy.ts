import type { PregnancyData } from "@types";
import { BodyPartType, getActivatedMods, IsoPlayer, triggerEvent, ZombRand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { ITEMS, MODS, ZWBFEventsEnum, ZWBFTraitsEnum } from "@constants";
import { ZWBFActionBirth } from "@actions/ZWBFBirth";
import { Player, TimedEvents } from "./Player";
import { Moodle } from "./Moodles";
import { PregnancyOptions } from "../SandboxOptions";

export class Pregnancy extends Player<PregnancyData> implements TimedEvents {
	private readonly options = {
		duration: PregnancyOptions.duration
	};

	private moodle?: Moodle;

	public Debug = {
		start: () => this.start(),
		stop: () => this.stop(),
		advance: (minutes: number) => {
			if (!this.pregnancy) return;

			const { current = 0 } = this.pregnancy;
			const { duration } = this.options;
			const updated = Math.min(duration, current + minutes);
			this.pregnancy = {
				current: updated,
				progress: updated / duration,
				isInLabor: updated == duration
			};
		},
		advanceToLabor: () => {
			if (!this.pregnancy) return;
			const { current = 0 } = this.pregnancy;
			const { duration } = this.options;
			this.Debug.advance(duration - current - 1);
		}
	};

	constructor() {
		super();
	}

	protected onCreatePlayer(player: IsoPlayer): void {
		super.onCreatePlayer(player);
		this.moodle = new Moodle({
			player,
			name: "Pregnancy",
			type: "Good",
			texture: "media/ui/Moodles/Pregnancy.png",
			tresholds: [0.3, 0.6, 0.8, 0.9]
		});
		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyHours.addListener(() => this.onEveryHour());
		Events.everyDays.addListener(() => this.onEveryDay());

		new Events.EventEmitter(ZWBFEventsEnum.PREGNANCY_START)
			.addListener(() => this.start());
		new Events.EventEmitter(ZWBFEventsEnum.PREGNANCY_LABOR)
			.addListener(() => this.onLabor());
	}

	/**
	 * Apply `default` values for `pregnancy` data
	 */
	private resetVariables() {
		this.pregnancy = {
			progress: 0,
			current: 0,
			isInLabor: false
		};
	}

	/**
	 * start Pregnancy (add Player trait)
	 */
	private start() {
		this.addTrait(ZWBFTraitsEnum.PREGNANCY);
		this.resetVariables();
	}

	/**
	 * stop Pregnancy (remove Player trait)
	 */
	private stop() {
		this.removeZWBFTrait(ZWBFTraitsEnum.PREGNANCY);
		this.resetVariables();
	}

	private onLabor() {
		this.applyBodyEffect(BodyPartType.Groin, { pain: 1, maxPain: 30 });
	}

	onEveryMinute(): void {
		if (!this.pregnancy) return;
		const { duration } = this.options;
		const current = this.pregnancy.current ?? 0;
		const previousInLabor = this.pregnancy.isInLabor ?? false;
		const updated = Math.min(duration, current + 1);
		const isInLabor = updated == duration;
		this.pregnancy = {
			current: updated,
			progress: updated / duration,
			isInLabor
		};
		if (isInLabor && !previousInLabor) {
			this.player!.setBlockMovement(true);
			ISTimedActionQueue.add(new ZWBFActionBirth(this));
		}
		this.moodle?.moodle(this.pregnancy.progress);
		triggerEvent(ZWBFEventsEnum.PREGNANCY_UPDATE, this.data);
	}

	onEveryHour(): void {
		if (!this.pregnancy) return;

		const { progress } = this.pregnancy;
		if (progress < 0.25) return;

		this.weightDebuff = progress;

		// Constume extra water
		const stats = this.player!.getStats();
		const water = (0.5 * progress) / 1440;
		stats.set(CharacterStat.THIRST, Math.min(1, stats.get(CharacterStat.THIRST) + water));

		// Constume extra calories
		const nutrition = this.player!.getNutrition();
		const calories = (600 * progress) / 1440;
		nutrition.setCalories(Math.max(-2200, nutrition.getCalories() - calories));
	}

	onEveryDay() {
		if (!this.pregnancy) return;
		/** Apply sickness in the begining of Pregnancy */
		const { progress } = this.pregnancy;
		if (progress < 0.05 || progress > 0.33) return;
		this.player!.getBodyDamage().setFoodSicknessLevel(50 + ZombRand(0, 50));
	}

	private set weightDebuff(progress: number) {
		this.player?.setMaxWeightBase(8 * (1 - progress / 2));
	}

	public birth() {
		if (!this.player) return;
		this.player.getInventory().AddItem(ITEMS.BABY);
		this.player.setBlockMovement(false);
		this.weightDebuff = 0;
		this.applyStatEffect({
			stat: "FATIGUE",
			value: 0.75,
			maxValue: 0.75
		});
		this.stop();
	}
}