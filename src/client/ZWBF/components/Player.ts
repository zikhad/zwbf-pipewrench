import { BodyPart, BodyPartType, HaloTextHelper, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { PregnancyData } from "@types";
import { ZWBFEventsEnum, ZWBFTraitsEnum } from "@constants";
import { CharacterTraitApi } from "@shared/components/CharacterTraitApi";
import { increaseClamped } from "@client/Utils";
import { ModData } from "./ModData";

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

		// Register custom events
		new Events.EventEmitter<(data: PregnancyData) => void>(
			ZWBFEventsEnum.PREGNANCY_UPDATE
		).addListener(data => this.onPregnancyUpdate(data));
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
			if(!this.data && this.defaultData) this.data = this.defaultData;
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
	}

	/**
	 * Given a `BodyPartType` return the `BodyPart` to apply numerous effects
	 * @param part The `BodyPartType` to return
	 */
	private getBodyPart(part: BodyPartType): BodyPart | null {
		if (!this.player) return null;
		return this.player.getBodyDamage().getBodyPart(part);
	}

	/**
	 * Applies pain, bleeding, and wetness effects to a specific body part.
	 *
	 * Each effect is applied as a positive delta. Pain can be optionally capped by `maxPain`.
	 * Resulting values will never be lower than their current values.
	 *
	 * @param part - The body part to affect.
	 * @param options - Configuration for effects.
	 * @param options.pain - Amount of pain to add.
	 * @param options.maxPain - Optional upper bound for pain.
	 * @param options.bleedTime - Amount of bleed time to add.
	 * @param options.wetness - Amount of wetness to add.
	 */
	protected applyBodyEffect(
		part: BodyPartType,
		{
			pain = 0,
			maxPain,
			bleedTime = 0,
			wetness = 0
		}: Partial<{
			pain: number;
			maxPain: number;
			bleedTime: number;
			wetness: number;
		}> = {}
	): void {
		const bodyPart = this.getBodyPart(part);
		if (!bodyPart) return;

		if (pain > 0) {
			const current = bodyPart.getAdditionalPain();
			bodyPart.setAdditionalPain(
				increaseClamped(current, pain, maxPain)
			);
		}

		if (bleedTime > 0) {
			const current = bodyPart.getBleedingTime();
			bodyPart.setBleedingTime(
				increaseClamped(current, bleedTime)
			);
		}

		if (wetness > 0) {
			const current = bodyPart.getWetness();
			bodyPart.setWetness(
				increaseClamped(current, wetness)
			);
		}
	}

	/**
	 * Applies a stat modification to the player.
	 *
	 * The stat will be increased by `value`, optionally capped by `maxValue`.
	 * The resulting value will never be lower than the current stat value.
	 *
	 * @param options.stat - The stat to modify.
	 * @param options.value - The amount to add to the current stat.
	 * @param options.maxValue - Optional upper bound for the resulting stat.
	 */
	protected applyStatEffect({
		stat,
		value,
		maxValue
	}: {
		stat: keyof typeof CharacterStat;
		value: number;
		maxValue?: number;
	}) {
		const stats = this.player?.getStats();
		if (!stats) return;

		const statKey = CharacterStat[stat];
		const current = stats.get(statKey);

		stats.set(statKey, increaseClamped(current, value, maxValue));
	}

	/**
	 * Check if player has a given item in their Inventory
	 * @param itemName Name of the item to search
	 * @param recursive check recursively in Inventory
	 * @returns True if player has item, false otherwise
	 */
	public hasItem(itemName: string, recursive = false): boolean {
		return this.player?.getInventory().contains(itemName, recursive) ?? false;
	}

	/**
	 * Displays halo text above the player with optional styling.
	 *
	 * @param props - Properties for the halo text.
	 * @param props.text - The text to display.
	 * @param {"good" | "bad"} [props.style] - Optional style for the text, affecting color and icon.
	 */
	public haloText(props: { text: string; style?: "good" | "bad"; }) {
		if (!this.player) return;
		const { text, style } = props;
		switch (style) {
			case "good":
				HaloTextHelper.addGoodText(this.player, text);
				break;
			case "bad":
				HaloTextHelper.addBadText(this.player, text);
				break;
			default:
				HaloTextHelper.addText(this.player, text);
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

	protected hasTrait(trait: ZWBFTraitsEnum): boolean {
		return this.player ? CharacterTraitApi.hasTrait(this.player, trait) : false;
	}

	protected addTrait(trait: ZWBFTraitsEnum): void {
		if (!this.player) return;
		CharacterTraitApi.addTrait(this.player, trait);
	}

	protected removeZWBFTrait(trait: ZWBFTraitsEnum): void {
		if (!this.player) return;
		CharacterTraitApi.removeTrait(this.player, trait);
	}

	public static hasTrait(player: IsoPlayer | undefined, trait: ZWBFTraitsEnum): boolean {
		if (!player) return false;
		return CharacterTraitApi.hasTrait(player, trait);
	}

	/**
	 * Get a skin color index of the player
	 * @returns Skin color index of the player [0-4]
	 */
	public get skinColorIndex() {
		return this.player?.getHumanVisual().getSkinTextureIndex() ?? 0;
	}

	get data(): T | null {
		return this.modData?.data ?? null;
	}

	set data(value: T) {
		if (!this.modData) return;
		this.modData.data = value;
	}

	get pregnancy(): PregnancyData | null {
		if (!this.hasTrait(ZWBFTraitsEnum.PREGNANCY)) return null;
		return this._pregnancy?.data ?? null;
	}

	set pregnancy(value: PregnancyData) {
		if (!this._pregnancy) return;
		this._pregnancy.data = value;
	}
}
