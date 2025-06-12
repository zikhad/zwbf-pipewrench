import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

export class Lactation {
	private player?: IsoPlayer;
	constructor() {
		Events.onCreatePlayer.addListener((_, player) => {
			this.player = player;
		});
	}
	get milkAmount() {
		return 10;
	}
	get bottleAmount() {
		return 10;
	}
	useMilk(amount: number, multiplier = 0, expiration = 0) {

	}
}
