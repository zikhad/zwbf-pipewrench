import { PregnancyData } from "@types";
import { Player } from "./Player";
import { IsoPlayer, triggerEvent } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZWBFEvents, ZWBFTraitsEnum } from "@constants";
class Pregnancy extends Player<PregnancyData> {
	// TODO: how to make sandbox vars work here?
    private options = {
        pregnancyTime: 14 * 24 * 60 // 14 days
    }
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
            current: 0,
            total: this.options.pregnancyTime,
            isInLabor: false
        };
    }
    protected onEveryMinute(): void {
        if(!this.pregnancy) return;
        const current = (this.pregnancy.current + 1);
        this.pregnancy = {
            ...this.pregnancy,
            current,
            isInLabor: (current > this.pregnancy.total)
        };
        
        // triggerEvent(ZWBFEvents.PREGNANCY_UPDATE, this.pregnancyData);
    }
}
