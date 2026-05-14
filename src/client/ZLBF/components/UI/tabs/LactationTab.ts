import { getText } from "@asledgehammer/pipewrench";
import { ZLBFUITabContext, ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";

/**
 * Tab implementation for the Lactation tab.
 */
export class LactationTab extends ZLBFUITabDefinition {
	readonly id = "Lactation";
	readonly TITLE_KEY = "IGUI_ZLBF_UI_Lactation_Title";
	readonly ELEMENTS = {
		image: "lactation-image",
		title: "lactation-title",
		level: "lactation-level"
	};

	build(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		ui.addImage(
			this.ELEMENTS.image,
			"media/ui/lactation/boobs/color-0/normal_empty.png"
		);
		ui.nextLine();
		ui.addText(
			this.ELEMENTS.title,
			getText("IGUI_ZLBF_UI_Milk_Amount"),
			undefined,
			"Center"
		);
		ui.addImage(
			this.ELEMENTS.level,
			"media/ui/lactation/level/milk_level_0.png"
		);
	}

	update(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		if (!context.lactation) return;
		const { breasts, level } = context.lactation.images;
		ui[this.ELEMENTS.image]?.setPath(breasts);
		ui[this.ELEMENTS.level]?.setPath(level);
	}
}
