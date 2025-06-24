import { PregnancyData } from "@types";
import { Player } from "./Player";
import { IsoPlayer, triggerEvent } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZWBFEvents, ZWBFTraitsEnum } from "@constants";
class Pregnancy extends Player<PregnancyData> {
	constructor() {
        super();
    }
    protected onCreatePlayer(player: IsoPlayer): void {
        /* this.defaultData = {
            isPregnant: false,
            progress: 0,
            isInLabor: false
        };*/
        super.onCreatePlayer(player);
        new Events.EventEmitter(ZWBFEvents.PREGNANCY_START).addListener(() => this.start());
    }
    private start() {
        this.player?.getTraits().add(ZWBFTraitsEnum.PREGNANCY);
        this.pregnancy = {
            progress: 0,
            isInLabor: false
        };
    }
    protected onEveryMinute(): void {
        if(!this.pregnancy) return;
        //this. = this.data;
        // triggerEvent(ZWBFEvents.PREGNANCY_UPDATE, this.pregnancyData);
    }
}
