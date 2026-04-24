import { ISBaseTimedAction, triggerEvent } from "@asledgehammer/pipewrench";
import { AnimationConfig, ANIMATIONS } from "@client/components/Animation";
import { Pregnancy } from "@client/components/Pregnancy";
import { ZLBFAnimations, ZLBFEventsEnum } from "@constants";

export class ZLBFActionBirth extends ISBaseTimedAction {
	private pregnancy: Pregnancy;
	constructor(pregnancy: Pregnancy) {
		super(pregnancy.player);
		super.derive("ZLBFActionBirth");
		this.pregnancy = pregnancy;
		this.maxTime = 5500;
		this.stopOnWalk = false;
		this.stopOnRun = false;
		this.stopOnAim = false;
	}

	isValid() {
		return true;
	}

	start() {
		super.start();
		this.setActionAnim(ZLBFAnimations.BIRTH, null);
	}

	update() {
		super.update();
		const delta = this.getJobDelta();
		triggerEvent(ZLBFEventsEnum.PREGNANCY_LABOR, delta);
		triggerEvent(ZLBFEventsEnum.ANIMATION, {
			animation: ANIMATIONS.BIRTH,
			delta,
			duration: this.maxTime
		} as AnimationConfig);
	}
	stop() {
		triggerEvent(ZLBFEventsEnum.ANIMATION_STOP);
	}

	perform() {
		super.perform();
		this.pregnancy.birth();
		triggerEvent(ZLBFEventsEnum.ANIMATION_STOP);
	}
}
