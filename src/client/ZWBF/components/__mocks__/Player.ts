/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsoPlayer } from "@asledgehammer/pipewrench";
import { PregnancyData } from "../../../../types";
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

	getBodyPart(arg: never) {
		return null as never;
	}

	hasItem(arg: never): boolean {
		return null as never;
	}

	haloText(...args: never[]) {}

	get skinColorIndex() {
		return 0;
	}

	get data() {
		return null as never;
	}

	set data(value: T) {}

	get pregnancy() {
		return null as never;
	}
	set pregnancy(value: PregnancyData) {}
}
