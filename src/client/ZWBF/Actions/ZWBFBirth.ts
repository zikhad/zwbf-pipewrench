import { ISBaseTimedAction, triggerEvent } from "@asledgehammer/pipewrench";
import { Pregnancy } from "@client/components/Pregnancy";
import { ZWBFEventsEnum } from "@constants";
import { AnimationStatus } from "@types";

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
		this.setActionAnim("blabla_Birthing", null);
		super.start();
	}

	update() {
		const delta = this.getJobDelta();
		triggerEvent(ZWBFEventsEnum.ANIMATION_UPDATE, {
			delta,
			duration: this.maxTime,
			isActive: true
		} as AnimationStatus);
		super.update();
	}

	perform() {
		this.pregnancy.birth();
		print("[ZWBF] Birth performed");
		triggerEvent(ZWBFEventsEnum.ANIMATION_UPDATE, {
			isActive: false
		} as AnimationStatus);
		super.perform();
		// this.stop();
		// this.forceComplete();
	}
}
