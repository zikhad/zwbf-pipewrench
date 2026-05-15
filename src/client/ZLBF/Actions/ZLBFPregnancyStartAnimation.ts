import { ISBaseTimedAction, IsoPlayer, triggerEvent } from "@asledgehammer/pipewrench";
import { ANIMATIONS, AnimationConfig, Animation } from "@client/components/Animation";
import { ZLBFEventsEnum } from "@constants";

export class ZLBFActionPregnancyStartAnimation extends ISBaseTimedAction {
	private readonly animation = ANIMATIONS.FERTILIZATION;
	private variant = 0;
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
		this.variant = Animation.getRandomVariantNumber(this.animation);
	}

	isValid() {
		return true;
	}

	update() {
		super.update();
		triggerEvent(ZLBFEventsEnum.ANIMATION, {
			animation: this.animation,
			variant: this.variant,
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