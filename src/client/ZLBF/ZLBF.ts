import { Lactation } from "@client/components/Lactation";
import { Womb } from "@client/components/Womb";
import { ZLBFUI } from "@client/components/ZLBFUI";
import { Pregnancy } from "@client/components/Pregnancy";
import { Effects } from "@client/components/Effects";
import { ContextMenu } from "@client/components/ContextMenu";
import { Animation } from "@client/components/Animation";

export const lactation = new Lactation();
export const womb = new Womb();
export const pregnancy = new Pregnancy();
export const effects = new Effects();
export const animation = new Animation(womb);

export const UI = new ZLBFUI({
	lactation,
	pregnancy,
	womb
});

export const contextMenu = new ContextMenu({
	lactation,
	pregnancy,
	womb,
	options: []
});
