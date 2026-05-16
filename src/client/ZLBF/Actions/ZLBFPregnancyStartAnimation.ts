import { ISBaseTimedAction, IsoPlayer, triggerEvent } from "@asledgehammer/pipewrench";
import { ANIMATIONS, AnimationUpdateConfig } from "@client/components/Animation";
import { ZLBFEventsEnum } from "@constants";

export class ZLBFActionPregnancyStartAnimation extends ISBaseTimedAction {
	private readonly animation = ANIMATIONS.FERTILIZATION;
	// private variant = 0;
	constructor(player: IsoPlayer) {
		super(player);
		super.derive("ZLBFActionPregnancyStartAnimation");
		this.maxTime = 800;
		this.stopOnWalk = false;
		this.stopOnRun = false;
		this.stopOnAim = false;
	}

	start() {
		super.start();
		triggerEvent(ZLBFEventsEnum.ANIMATION_START, this.animation);
	}

	isValid() {
		return true;
	}

	update() {
		super.update();
		triggerEvent(ZLBFEventsEnum.ANIMATION_UPDATE, {
			delta: this.getJobDelta(),
			duration: this.maxTime
		} as AnimationUpdateConfig);
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