import type { PregnancyData } from "@types";
import { IsoPlayer, ZombRand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { ZWBFEvents, ZWBFTraitsEnum } from "@constants";
import { ZWBFActionBirth } from "@actions/ZWBFBirth";
import { Player, TimedEvents } from "./Player";
import { Moodle } from "./Moodles";
export class Pregnancy extends Player<PregnancyData> implements TimedEvents {
	// TODO: how to make sandbox vars work here?
	private options = {
		duration: 14 * 24 * 60 // 14 days
	};

	private readonly BABY_LIST = [
		"Baby_01_b",
		"Baby_02",
		"Baby_02_b",
		"Baby_03",
		"Baby_03_b",
		"Baby_07",
		"Baby_07_b",
		"Baby_08",
		"Baby_08_b",
		"Baby_09",
		"Baby_09_b",
		"Baby_10",
		"Baby_10_b",
		"Baby_11",
		"Baby_11_b",
		"Baby_12",
		"Baby_12_b",
		"Baby_13",
		"Baby_14"
	];

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
				isInLabor: (updated == duration)
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

		new Events.EventEmitter(ZWBFEvents.PREGNANCY_START).addListener(() => this.start());
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
		this.player?.getTraits().add(ZWBFTraitsEnum.PREGNANCY);
		this.resetVariables();
	}

	/**
	 * stop Pregnancy (remove Player trait)
	 */
	private stop() {
		this.player?.getTraits().remove(ZWBFTraitsEnum.PREGNANCY);
		this.resetVariables();
	}

	onEveryMinute(): void {
		if (!this.pregnancy) return;
		const { duration } = this.options;
		const { current = 0 } = this.pregnancy;
		const updated = Math.min(duration, current + 1);
		this.pregnancy = {
			current: updated,
			progress: updated / duration,
			isInLabor: updated == duration
		};
		if (this.pregnancy.isInLabor) {
			this.player!.setBlockMovement(true);
			ISTimedActionQueue.add(new ZWBFActionBirth(this));
		}
		this.moodle?.moodle(this.pregnancy.progress);
	}

	onEveryHour(): void {
		if (!this.pregnancy) return;

		const { progress } = this.pregnancy;
		if (progress < 0.25) return;

		this.weightDebuff = progress;

		// Constume extra water
		const stats = this.player!.getStats();
		const water = (0.5 * progress) / 1440;
		stats.setThirst(Math.min(1, stats.getThirst() + water));

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
		this.player!.getBodyDamage().setFoodSicknessLevel(50 + ZombRand(50));
	}

	private set weightDebuff(progress: number) {
		this.player?.setMaxWeightBase(8 * (1 - progress / 2));
	}

	public birth() {
		if (!this.player) return;
		const baby = this.BABY_LIST[ZombRand(0, this.BABY_LIST.length)];
		this.player.getInventory().AddItem(`Babies.${baby}`);
		this.player.setBlockMovement(false);
		this.weightDebuff = 0;
		this.stop();
	}
}
