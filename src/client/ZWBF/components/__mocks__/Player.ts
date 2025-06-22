import { BodyPart, IsoPlayer } from "@asledgehammer/pipewrench";
import { PregnancyData } from "@types";
export class Player<T = unknown> {
	public player?: IsoPlayer;
	public _data?: T;
	
	public _pregnancy?: PregnancyData;
	public defaultData?: T;
	
	constructor() {}
	
	onCreatePlayer(player: IsoPlayer) {
		this.player = player;
	}
	onPregnancyUpdate() {}
	
	getBodyPart(part: never) {
		return null as never;		
	}
	
	get data() { return null as never; }
	
	set data(value: T) { }
	
	get pregnancy() { return null as never }
	set pregnancy(value: PregnancyData ) { }
	
}
