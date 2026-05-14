import { ISBaseTimedAction, IsoPlayer, triggerEvent } from "@asledgehammer/pipewrench";
import { ANIMATIONS, AnimationConfig } from "@client/components/Animation";
import { ZLBFEventsEnum } from "@constants";

export class ZLBFActionPregnancyStartAnimation extends ISBaseTimedAction {
	constructor(player: IsoPlayer) {
		super(player);
		super.derive("ZLBFActionPregnancyStartAnimation");
		this.maxTime = 800;
		this.stopOnWalk = false;
		this.stopOnRun = false;
		this.stopOnAim = false;
	}

	isValid() {
		return true;
	}

	update() {
		super.update();
		triggerEvent(ZLBFEventsEnum.ANIMATION, {
			animation: ANIMATIONS.FERTILIZATION,
			delta: this.getJobDelta(),
			duration: this.maxTime
		} as AnimationConfig);
	}

	stop() {
		super.stop();
		triggerEvent(ZLBFEventsEnum.ANIMATION_STOP);
	}

	perform() {
		super.perform();
		triggerEvent(ZLBFEventsEnum.ANIMATION_STOP);
	}
}