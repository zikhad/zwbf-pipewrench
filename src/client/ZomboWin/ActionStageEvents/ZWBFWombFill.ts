import { getActivatedMods, ISBaseTimedAction, triggerEvent, require as pipewrenchRequire, IsoPlayer } from "@asledgehammer/pipewrench";
import { ISTimedActionQueue } from "@asledgehammer/pipewrench/client";
import { AnimationConfig, ANIMATIONS } from "@client/components/Animation";
import { MODS, ZWBFEventsEnum } from "@constants";


const isAllowedZombowinAnimation = (
	player: IsoPlayer,
	excludedTags: string[] = ["Oral", "Masturbation", "Anal", "Solo", "Mast"]
) => {
	const getAnim = () => {
		const { queue }: { queue: { animation: string }[] } = ISTimedActionQueue.getTimedActionQueue(player);

		return queue[0]?.animation ?? null;
	};

	const getAnimInfo = () => {
		const currentAnim = getAnim();
		if (!currentAnim) return null;

		for (const data of ZomboWinAnimationData) {
			for (const { stages } of data.actors) {
				const { perform } = stages[0];
				if (perform == currentAnim) {
					return data;
				}
			}
		}
		return null;
	};

	const tags = getAnimInfo()?.tags;
	if (!tags) return false;
	return !tags.some(tag => excludedTags.includes(tag));
}

if (getActivatedMods().contains(MODS.ZOMBOWIN)) {

	const { ActionEvents } = pipewrenchRequire("ZomboWin/ZomboWin").AnimationHandler;

	table.insert(ActionEvents.Update, (action: ISBaseTimedAction) => {
		const character = action.character;
		if (character.isFemale() && isAllowedZombowinAnimation(character)) {
			const duration = action.duration;
			const delta = action.getJobDelta();
			triggerEvent(ZWBFEventsEnum.ANIMATION, {
				animation: ANIMATIONS.INTERCOURSE,
				delta,
				duration
			} as AnimationConfig);
		}
	});

		table.insert(ActionEvents.Perform, (action: ISBaseTimedAction) => {
		const character = action.character;
		if (character.isFemale()) {
			triggerEvent(ZWBFEventsEnum.INTERCOURSE);
		}
		triggerEvent(ZWBFEventsEnum.ANIMATION_STOP);
	});

	table.insert(ActionEvents.Stop, () => {
		triggerEvent(ZWBFEventsEnum.ANIMATION_STOP);
	});
}

