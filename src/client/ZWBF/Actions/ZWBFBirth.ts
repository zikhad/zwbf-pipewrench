import { ISBaseTimedAction, triggerEvent } from "@asledgehammer/pipewrench";
import { Pregnancy } from "@client/components/Pregnancy";
import { ZWBFEvents } from "shared/constants";
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
		super.start();
		this.setActionAnim("blabla_Birthing", null);
	}

	update() {
		super.update();
		const delta = this.getJobDelta();
		triggerEvent(ZWBFEvents.ANIMATION_UPDATE, {
			delta,
			duration: this.maxTime,
			isActive: true
		} as AnimationStatus);
	}

	perform() {
		super.perform();
		this.pregnancy.birth();
		triggerEvent(ZWBFEvents.ANIMATION_UPDATE, {
			isActive: false
		} as AnimationStatus);
	}
}
