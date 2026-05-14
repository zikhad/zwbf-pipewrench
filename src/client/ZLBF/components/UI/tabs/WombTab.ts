import { getText, triggerEvent } from "@asledgehammer/pipewrench";
import { Animation } from "@client/components/Animation";
import { Player } from "@client/components/Player";
import { valueInMilliliters } from "@client/Utils";
import { ZLBFUITabContext, ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";
import { ZLBFEventsEnum, ZLBFTraitsEnum } from "@constants";

/**
 * Tab implementation for the Womb tab.
 */
export class WombTab extends ZLBFUITabDefinition {
	readonly id = "Womb";
	readonly TITLE_KEY = "IGUI_ZLBF_UI_Womb_Title";
	readonly ELEMENTS = {
		womb: {
			title: "womb-title",
			image: "womb-image"
		},
		sperm: {
			currentTitle: "womb-sperm-current-title",
			currentAmount: "womb-sperm-current-amount",
			totalTitle: "womb-sperm-total-title",
			totalAmount: "womb-sperm-total-amount"
		},
		cycle: {
			title: "womb-cycle-title",
			phaseTitle: "womb-cycle-phase-title",
			phaseValue: "womb-cycle-phase-value"
		},
		fertility: {
			title: "womb-fertility-title",
			levelValue: "womb-fertility-level-value",
			levelImage: "womb-fertility-level-image",
			eggImage: "womb-fertility-egg-image"
		}
	}

	build(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		ui.nextLine();
		ui.addImage(this.ELEMENTS.womb.image, "media/ui/womb/normal/womb_normal_0.png");
		ui.nextLine();
		ui.addText(
			this.ELEMENTS.sperm.currentTitle,
			getText("IGUI_ZLBF_UI_Current"),
			undefined,
			"Center"
		);
		ui.addText(this.ELEMENTS.sperm.currentAmount, "0 ml", undefined, "Center");
		ui.nextLine();
		ui.addText(
			this.ELEMENTS.sperm.totalTitle,
			getText("IGUI_ZLBF_UI_Total"),
			undefined,
			"Center"
		);
		ui.addText(this.ELEMENTS.sperm.totalAmount, "0 ml", undefined, "Center");
		ui.nextLine();
		ui.addText(
			this.ELEMENTS.cycle.title,
			getText("IGUI_ZLBF_UI_Cycle"),
			undefined,
			"Center"
		);
		ui.nextLine();
		ui.addText(
			this.ELEMENTS.cycle.phaseTitle,
			getText("IGUI_ZLBF_UI_Phase"),
			undefined,
			"Center"
		);
		ui.addText(this.ELEMENTS.cycle.phaseValue, "", undefined, "Center");
		ui.nextLine();

		if (!context.player || !Player.hasTrait(context.player, ZLBFTraitsEnum.INFERTILE)) {
			ui.addText(
				this.ELEMENTS.fertility.title,
				getText("IGUI_ZLBF_UI_Fertility"),
				undefined,
				"Center"
			);
			ui.nextLine();
			ui.addText(
				this.ELEMENTS.fertility.levelValue,
				"100%",
				undefined,
				"Center"
			);
			ui.addImage(
				this.ELEMENTS.fertility.levelImage,
				"media/ui/fertility/level/fertility_level_5.png"
			);
			ui.addImage(
				this.ELEMENTS.fertility.eggImage,
				"media/ui/fertility/egg/egg.png",
				{ height: 26 }
			);
			ui.nextLine();
		}
	}

	update(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		if (!context.womb) return;

		const { phaseTranslation, fertility, amount, total, fertilityLevelImage, fertilityEggImage } = context.womb;
		const pregnancy = context.pregnancy?.pregnancy;

		triggerEvent(ZLBFEventsEnum.IMAGE);

		ui[this.ELEMENTS.sperm.currentAmount]?.setText(valueInMilliliters(amount));
		ui[this.ELEMENTS.sperm.totalAmount]?.setText(valueInMilliliters(total));
		ui[this.ELEMENTS.womb.image]?.setPath(Animation.wombImage);
		ui[this.ELEMENTS.cycle.phaseValue]?.setText(getText(phaseTranslation));

		if (!context.player || Player.hasTrait(context.player, ZLBFTraitsEnum.INFERTILE)) {
			return;
		}

		/* const title = getText(`IGUI_ZLBF_UI_${pregnancy ? "Pregnancy" : "Fertility"}`);
		const progress = pregnancy ? pregnancy.progress : fertility; */
		const progress = pregnancy ? pregnancy.progress : fertility;

		ui[this.ELEMENTS.fertility.levelValue]?.setText(`${Math.floor(progress * 100)}%`);
		ui[this.ELEMENTS.fertility.levelImage]?.setPath(`media/ui/fertility/level/${fertilityLevelImage}`);
		ui[this.ELEMENTS.fertility.eggImage]?.setPath(`media/ui/fertility/egg/${fertilityEggImage}`);
		/* ui[this.ELEMENTS.fertility.title]?.setText(title);
		ui[this.ELEMENTS.fertility.bar]?.setValue(progress);
		ui[this.ELEMENTS.fertility.value]?.setText(`${Math.floor(progress * 100)}%`); */
	}
}
