import { ISBaseTimedAction, triggerEvent } from "@asledgehammer/pipewrench";
import { ZWBFEvents } from "@constants";
import { AnimationStatus } from "@types";
import { AnimationHandler } from "ZomboWin/ZomboWin";

const { ActionEvents } = AnimationHandler;
table.insert(ActionEvents.Perform, (action: ISBaseTimedAction) => {
	const character = action.character;
	// TODO: add animation allow
	if (character.isFemale()) {
		triggerEvent(ZWBFEvents.INTERCOURSE);
	}
});

table.insert(ActionEvents.Update, (action: ISBaseTimedAction) => {
	const character = action.character;
	// TODO: add animation allow
	if (character.isFemale()) {
		const duration = action.duration;
		const delta = action.getJobDelta();
		triggerEvent(ZWBFEvents.ANIMATION_UPDATE, {
			isActive: true,
			delta,
			duration
		} as AnimationStatus);
	}
});

table.insert(ActionEvents.Stop, () => {
	triggerEvent(ZWBFEvents.ANIMATION_UPDATE, { isActive: false } as AnimationStatus);
});
