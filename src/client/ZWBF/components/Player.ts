import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { PregnancyData } from "@types";
import { ModData } from "./ModData";
import { ZWBFEvents } from "@constants";

export abstract class Player<T> {
	protected player?: IsoPlayer;
	protected modData?: ModData<T>;
	protected data? :T;
	protected pregnancy?: PregnancyData;

	private modKey: string;
	protected defaultData?: T;

	constructor(modKey: string) {
		this.modKey = modKey;
		this.pregnancy = { isPregnant: false, progress: 0 };
		
		Events.onCreatePlayer.addListener((_, player) => this.onCreatePlayer(player));
		Events.everyOneMinute.addListener(() => this.onEveryMinute());
		Events.everyHours.addListener(() => this.onEveryMinute());
		new Events.EventEmitter<(data: PregnancyData) => void>(ZWBFEvents.PREGNANCY_UPDATE)
			.addListener((data) => this.onPregnancyUpdate(data));
	}

	protected onCreatePlayer(player: IsoPlayer) {
		this.player = player;
		this.modData = new ModData<T>({
			object: player,
			modKey: this.modKey,
			defaultData: this.defaultData
		});
		this.data = this.modData.data;
	}

	/**
	* Handles pregnancy progress updates
	*/
	protected onPregnancyUpdate(data: PregnancyData) {
		this.pregnancy = data;
	}
	
	/**
	* Periodic minute update: Syncs and triggers event
	*/
	protected onEveryMinute() {
		this.modData!.data = this.data!;
	}
}