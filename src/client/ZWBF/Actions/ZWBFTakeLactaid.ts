import { InventoryItem, IsoGameCharacter, ZombRandFloat } from "@asledgehammer/pipewrench";
import { Lactation } from "@client/components/Lactation";
import { ZWBFTakePills } from "./ZWBFTakePills";


export class ZWBTakeLactaid extends ZWBFTakePills {
    private lactation: Lactation;
    constructor(lactation: Lactation, pills: InventoryItem) {
        super({
            name: "ZWBFActionTakeLactaid",
            character: lactation.player!,
            contextMenu:  "ContextMenu_Take_Lactaid",
            pills
        });
        this.lactation = lactation;
    }
    perform() {
        super.perform();
        const multiplier = this.lactation.multiplier + ZombRandFloat(0, 0.3); 
        this.lactation.useMilk(0, multiplier);
    }
}