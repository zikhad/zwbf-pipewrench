import { getActivatedMods, ISBaseTimedAction, triggerEvent, require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import { MODS, ZWBFEventsEnum } from "@constants";
import type { AnimationStatus } from "@types";

if (getActivatedMods().contains(MODS.ZOMBOWIN)) {

	const { ActionEvents } = pipewrenchRequire("ZomboWin/ZomboWin").AnimationHandler;
	table.insert(ActionEvents.Perform, (action: ISBaseTimedAction) => {
		const character = action.character;
		if (character.isFemale()) {
			triggerEvent(ZWBFEventsEnum.INTERCOURSE);
		}
	});
	
	table.insert(ActionEvents.Update, (action: ISBaseTimedAction) => {
		const character = action.character;
		if (character.isFemale()) {
			const duration = action.duration;
			const delta = action.getJobDelta();
			triggerEvent(ZWBFEventsEnum.ANIMATION_UPDATE, {
				isActive: true,
				delta,
				duration
			} as AnimationStatus);
		}
	});
	
	table.insert(ActionEvents.Stop, () => {
		triggerEvent(ZWBFEventsEnum.ANIMATION_UPDATE, { isActive: false } as AnimationStatus);
	});
}

