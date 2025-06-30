import { BodyPart, BodyPartType, HaloTextHelper, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { PregnancyData } from "@types";
import { ModData } from "./ModData";
import { ZWBFEvents, ZWBFTraitsEnum } from "shared/constants";

export interface TimedEvents {
	/**
	 * Called every in-game minute.
	 */
	onEveryMinute?: () => void;
	/**
	 * Called every in-game 10 minutes
	 */
	onEveryTenMinutes?: () => void;
	/**
	 * Called every in-game hour
	 */
	onEveryHour?: () => void;
	/**
	 * Called every in-game day
	 */
	onEveryDay?: () => void;
}

/**
 * Abstract base class to manage per-player mod state, pregnancy updates,
 * and ModData lifecycle for Project Zomboid players.
 *
 * @template T - The type of data stored in ModData for this player.
 */
export abstract class Player<T> {
	/** Reference to the current player instance */
	public player?: IsoPlayer;

	/** ModData instance wrapping game storage for this player */
	protected modData?: ModData<T>;

	/** Actual typed data payload stored in ModData */
	// protected data?: T;

	/** Current pregnancy state data for this player */
	protected _pregnancy?: ModData<PregnancyData>;

	/** ModData key used for storage and retrieval */
	private readonly modKey?: string;

	/** Default data assigned on player creation */
	protected defaultData?: T;

	/**
	 * Constructs the base Player instance and registers common game events.
	 *
	 * @param {string} modKey - The key used to identify this mod's data namespace.
	 */
	protected constructor(modKey?: string) {
		this.modKey = modKey;

		// Register Zomboid lifecycle listeners
		Events.onCreatePlayer.addListener((_, player) => this.onCreatePlayer(player));
	}

	/**
	 * Initializes mod data and hooks for a newly created player.
	 *
	 * @param {IsoPlayer} player - The player instance created by the game.
	 */
	protected onCreatePlayer(player: IsoPlayer): void {
		this.player = player;
		if (this.modKey) {
			this.modData = new ModData({
				object: player,
				modKey: this.modKey,
				defaultData: this.defaultData
			});
		}

		this._pregnancy = new ModData({
			object: player,
			modKey: "ZWBFPregnancy",
			defaultData: {
				current: 0,
				progress: 0,
				isInLabor: false
			}
		});
		// Events.everyOneMinute.addListener(() => this.onEveryMinute());
		// Events.everyHours.addListener(() => this.onEveryHour());

		new Events.EventEmitter<(data: PregnancyData) => void>(
			ZWBFEvents.PREGNANCY_UPDATE
		).addListener(data => this.onPregnancyUpdate(data));
	}

	/**
	 * Given a `BodyPartType` return the `BodyPart` to apply numerous effects
	 * @param part The `BodyPartType` to return
	 */
	getBodyPart(part: BodyPartType): BodyPart | null {
		if (!this.player) return null;
		return this.player.getBodyDamage().getBodyPart(part);
	}

	hasItem(itemName: string, recursive = false): boolean {
		return this.player?.getInventory().contains(itemName, recursive) ?? false;
	}

	haloText({
		text,
		color,
		arrow
	}: {
		text: string;
		color?: "green" | "red";
		arrow?: "up" | "down";
	}) {
		if (!this.player) return;
		const getColor = (color?: "green" | "red") => {
			switch (color) {
				case "green":
					return HaloTextHelper.getColorGreen();
				case "red":
					return HaloTextHelper.getColorRed();
				default:
					return HaloTextHelper.getColorWhite();
			}
		};
		const txtColor = getColor(color);
		switch (arrow) {
			case "up":
			case "down":
				HaloTextHelper.addTextWithArrow(this.player, text, arrow === "up", txtColor);
				break;
			default:
				HaloTextHelper.addText(this.player, text, txtColor);
		}
	}

	/**
	 * Updates pregnancy data for this player.
	 *
	 * @param {PregnancyData} data - Pregnancy state including progress and flags.
	 */
	protected onPregnancyUpdate(data: PregnancyData): void {
		this.pregnancy = data;
	}

	get data(): T | null {
		return this.modData?.data ?? null;
	}

	set data(value: T) {
		if (!this.modData) return;
		this.modData.data = value;
	}

	get pregnancy(): PregnancyData | null {
		if (!this.player?.HasTrait(ZWBFTraitsEnum.PREGNANCY)) return null;
		return this._pregnancy?.data ?? null;
	}

	set pregnancy(value: PregnancyData) {
		if (!this._pregnancy) return;
		this._pregnancy.data = value;
	}
}
