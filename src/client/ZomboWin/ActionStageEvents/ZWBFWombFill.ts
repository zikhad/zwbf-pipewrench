import { getActivatedMods, ISBaseTimedAction, triggerEvent, require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import { AnimationConfig, ANIMATIONS } from "@client/components/Animation";
import { MODS, ZWBFEventsEnum } from "@constants";

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
			triggerEvent(ZWBFEventsEnum.ANIMATION, {
				animation: ANIMATIONS.INTERCOURSE,
				delta,
				duration
			} as AnimationConfig);
		}
	});
	
	table.insert(ActionEvents.Stop, () => {
		triggerEvent(ZWBFEventsEnum.IMAGE);
	});
}

