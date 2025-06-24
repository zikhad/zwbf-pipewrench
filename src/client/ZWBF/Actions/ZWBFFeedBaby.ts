import { AlarmClock, GameTime, getGametimeTimestamp, getText, InventoryItem, ISBaseTimedAction, IsoGameCharacter, ZombRandFloat } from "@asledgehammer/pipewrench";
import { Lactation } from "@client/components/Lactation";

export class ZWBFFeedBaby extends ISBaseTimedAction {
    private lactation: Lactation;
    private baby: InventoryItem;
    constructor(lactation: Lactation, baby: InventoryItem) {
        super(lactation.player);
        super.derive("ZWBFActionFeedBaby");
        this.lactation = lactation;
        this.baby = baby;
        this.maxTime = 1500;
        this.stopOnAim = false;
        this.stopOnRun = false;
        this.stopOnWalk = false;
    }

    private feedBaby() {
        const player = this.character as IsoGameCharacter;
        const baby = this.baby as AlarmClock;
        const gameTime = GameTime.getInstance();

        const soundEmitter = player.getEmitter();
        const hour = gameTime.getHour();
        const timestamp = getGametimeTimestamp();
        
        // not feeding
        if(baby.getModData().feedTime) {
            const feedTime = baby.getModData().feedTime as number;
            const lastFeedTime = timestamp -feedTime;
            if (lastFeedTime < 14400) {
                player.Say(getText("IGUI_ZWBF_UI_Baby_Vomits"));
            }
        }

        // Set alarm for 6 hours
        baby.setHour((hour + 6) % 24);
        baby.getModData().feedBaby = timestamp;
        baby.setAlarmSet(true);

        if(soundEmitter.isPlaying("BreastfeedBaby")) {
            soundEmitter.stopSoundByName("BreastfeedBaby");
        }

        if (baby.isRinging()) {
            baby.stopRinging();
        }

    }

    isValid() {
        return (this.character as IsoGameCharacter).getInventory().contains(this.baby);
    }
    start() {
        this.baby.setJobType(getText("ContextMenu_BreastFeed_Baby"))
        this.baby.setJobDelta(0.0);
        this.setActionAnim("FeedBaby", null);
        this.setOverrideHandModels(null, this.baby, null);
        (this.character as IsoGameCharacter).playSound("BreastfeedBaby");
    }
    update() {
        super.update();
        this.baby.setJobDelta(this.getJobDelta());
    }
    perform() {
        super.perform();
        this.baby.getContainer().setDrawDirty(true);
        this.baby.setJobDelta(0);
        this.lactation.useMilk(
            this.lactation.bottleAmount,
            ZombRandFloat(0.1, 0.3)
        );
        this.feedBaby();
    }
}