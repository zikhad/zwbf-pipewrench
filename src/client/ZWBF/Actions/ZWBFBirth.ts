import { ISBaseTimedAction, triggerEvent } from "@asledgehammer/pipewrench";
import { AnimationConfig, ANIMATIONS } from "@client/components/Animation";
import { Pregnancy } from "@client/components/Pregnancy";
import { ZWBFAnimations, ZWBFEventsEnum } from "@constants";

export class ZWBFActionBirth extends ISBaseTimedAction {
	private pregnancy: Pregnancy;
	constructor(pregnancy: Pregnancy) {
		super(pregnancy.player);
		super.derive("ZWBFActionBirth");
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
		this.setActionAnim(ZWBFAnimations.BIRTH, null);
	}

	update() {
		super.update();
		const delta = this.getJobDelta();
		triggerEvent(ZWBFEventsEnum.PREGNANCY_LABOR, delta);
		triggerEvent(ZWBFEventsEnum.ANIMATION, {
			animation: ANIMATIONS.BIRTH,
			delta,
			duration: this.maxTime
		} as AnimationConfig);
	}
	stop() {
		triggerEvent(ZWBFEventsEnum.IMAGE);
	}

	perform() {
		super.perform();
		this.pregnancy.birth();
	}
}
