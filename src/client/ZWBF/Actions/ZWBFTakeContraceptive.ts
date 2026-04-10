import { Womb } from "@client/components/Womb";
import { ZWBFTakePills } from "@actions/ZWBFTakePills";
import { InventoryItem } from "@asledgehammer/pipewrench";

export class ZWBTakeContraceptive extends ZWBFTakePills {
	private womb: Womb;
	constructor(womb: Womb, pills: InventoryItem) {
		super({
			name: "ZWBFActionTakeLactaid",
			character: womb.player!,
			contextMenu: "ContextMenu_Take_Contraceptive",
			pills
		});
		this.womb = womb;
	}
	perform() {
		this.womb.contraceptive = true;
		super.perform();
	}
}
