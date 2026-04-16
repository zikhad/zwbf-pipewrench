import { Lactation } from "@client/components/Lactation";
import { Womb } from "@client/components/Womb";
import { ZWBFUI } from "@client/components/ZWBFUI";
import { Pregnancy } from "@client/components/Pregnancy";
import { Effects } from "@client/components/Effects";
import { ContextMenu } from "@client/components/ContextMenu";
import { getText } from "@asledgehammer/pipewrench";
import { Animation } from "@client/components/Animation";

export const lactation = new Lactation();
export const womb = new Womb();
export const pregnancy = new Pregnancy();
export const effects = new Effects();
export const animation = new Animation(womb);

export const UI = new ZWBFUI({
	lactation,
	pregnancy,
	womb
});

export const contextMenu = new ContextMenu({
	lactation,
	pregnancy,
	womb,
	options: [
		{
			title: getText("ContextMenu_ZWBF_Being_Female_Title"),
			description: getText("ContextMenu_ZWBF_Being_Female_Description"),
			fn: () => UI.toggle()
		}
	]
});
