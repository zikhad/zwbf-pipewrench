import { getText } from "@asledgehammer/pipewrench";
import { ZLBFUIElements } from "@client/components/UI/ZLBFUIElements";
import { ZLBFUITabContext, ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";

/**
 * Tab implementation for the Lactation tab.
 */
export class LactationTab extends ZLBFUITabDefinition {
	readonly id = "Lactation";
	readonly TITLE_KEY = "IGUI_ZLBF_UI_Lactation_Title";

	build(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		ui.addImage(
			ZLBFUIElements.lactation.image,
			"media/ui/lactation/boobs/color-0/normal_empty.png"
		);
		ui.nextLine();
		ui.addText(
			ZLBFUIElements.lactation.title,
			getText("IGUI_ZLBF_UI_Milk_Amount"),
			undefined,
			"Center"
		);
		ui.addImage(
			ZLBFUIElements.lactation.level,
			"media/ui/lactation/level/milk_level_0.png"
		);
	}

	update(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		if (!context.lactation) return;
		const { breasts, level } = context.lactation.images;
		ui[ZLBFUIElements.lactation.image]?.setPath(breasts);
		ui[ZLBFUIElements.lactation.level]?.setPath(level);
	}
}
