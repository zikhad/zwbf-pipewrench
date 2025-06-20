import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { PregnancyData } from "@types";
import { ModData } from "./ModData";
import { ZWBFEvents, ZWBFTraitsEnum } from "@constants";
import { ZWBFTraits } from "@shared/components/ZWBFTraits";

/**
 * Abstract base class to manage per-player mod state, pregnancy updates,
 * and ModData lifecycle for Project Zomboid players.
 *
 * @template T - The type of data stored in ModData for this player.
 */
export abstract class Player<T> {
	/** Reference to the current player instance */
	protected player?: IsoPlayer;
	
	/** ModData instance wrapping game storage for this player */
	protected modData?: ModData<T>;
	
	/** Actual typed data payload stored in ModData */
	protected data?: T;
	
	/** Current pregnancy state data for this player */
	protected pregnancy?: PregnancyData;
	
	/** ModData key used for storage and retrieval */
	private readonly modKey: string;
	
	/** Default data assigned on player creation */
	protected defaultData?: T;
	
	/**
	 * Constructs the base Player instance and registers common game events.
	 *
	 * @param {string} modKey - The key used to identify this mod's data namespace.
	 */
	protected constructor(modKey: string) {
		this.modKey = modKey;
		this.pregnancy = { isPregnant: false, progress: 0 };
		
		// Register Zomboid lifecycle listeners
		Events.onCreatePlayer.addListener((_, player) => this.onCreatePlayer(player));
		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyHours.addListener(() => this.onEveryMinute());
		
		new Events.EventEmitter<(data: PregnancyData) => void>(
			ZWBFEvents.PREGNANCY_UPDATE
		).addListener(data => this.onPregnancyUpdate(data));
	}
	
	/**
	 * Initializes mod data and hooks for a newly created player.
	 *
	 * @param {IsoPlayer} player - The player instance created by the game.
	 */
	protected onCreatePlayer(player: IsoPlayer): void {
		this.player = player;
		this.modData = new ModData<T>({
			object: player,
			modKey: this.modKey,
			defaultData: this.defaultData
		});
		this.data = this.modData.data;
	}
	
	/**
	 * Updates pregnancy data for this player.
	 *
	 * @param {PregnancyData} data - Pregnancy state including progress and flags.
	 */
	protected onPregnancyUpdate(data: PregnancyData): void {
		this.pregnancy = data;
	}
	
	/**
	 * Called every in-game minute. Used to sync mod data with the engine.
	 */
	protected onEveryMinute(): void {
		this.modData!.data = this.data!;
	}
	
	get isPregnant(): boolean {
		return this.player?.HasTrait(ZWBFTraitsEnum.PREGNANCY) ?? false;
	}
}
