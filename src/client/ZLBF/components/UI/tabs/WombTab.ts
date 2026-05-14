import { getText, triggerEvent } from "@asledgehammer/pipewrench";
import { Animation } from "@client/components/Animation";
import { Player } from "@client/components/Player";
import { valueInMilliliters } from "@client/Utils";
import { ZLBFUIElements } from "@client/components/UI/ZLBFUIElements";
import { ZLBFUITabContext, ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";
import { ZLBFEventsEnum, ZLBFTraitsEnum } from "@constants";

/**
 * Tab implementation for the Womb tab.
 */
export class WombTab extends ZLBFUITabDefinition {
	readonly id = "Womb";
	readonly titleKey = "IGUI_ZLBF_UI_Womb_Title";

	build(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		ui.nextLine();
		ui.addImage(ZLBFUIElements.womb.image, "media/ui/womb/normal/womb_normal_0.png");
		ui.nextLine();
		ui.addText(
			ZLBFUIElements.womb.sperm.current.title,
			getText("IGUI_ZLBF_UI_Current"),
			undefined,
			"Center"
		);
		ui.addText(ZLBFUIElements.womb.sperm.current.amount, "0 ml", undefined, "Center");
		ui.nextLine();
		ui.addText(
			ZLBFUIElements.womb.sperm.total.title,
			getText("IGUI_ZLBF_UI_Total"),
			undefined,
			"Center"
		);
		ui.addText(ZLBFUIElements.womb.sperm.total.amount, "0 ml", undefined, "Center");
		ui.nextLine();
		ui.addText(
			ZLBFUIElements.womb.cycle.title,
			getText("IGUI_ZLBF_UI_Cycle"),
			undefined,
			"Center"
		);
		ui.nextLine();
		ui.addText(
			ZLBFUIElements.womb.cycle.phase.title,
			getText("IGUI_ZLBF_UI_Phase"),
			undefined,
			"Center"
		);
		ui.addText(ZLBFUIElements.womb.cycle.phase.value, "", undefined, "Center");
		ui.nextLine();

		if (!context.player || !Player.hasTrait(context.player, ZLBFTraitsEnum.INFERTILE)) {
			ui.addText(
				ZLBFUIElements.womb.fertility.title,
				getText("IGUI_ZLBF_UI_Fertility"),
				undefined,
				"Center"
			);
			ui.addProgressBar(ZLBFUIElements.womb.fertility.bar, 0, 0, 1);
			ui.addText(ZLBFUIElements.womb.fertility.value, "", undefined, "Center");
			ui.nextLine();
		}
	}

	update(ui: ZLBFTabbedUI, context: ZLBFUITabContext) {
		if (!context.womb) return;

		const { phaseTranslation, fertility, amount, total } = context.womb;
		const pregnancy = context.pregnancy?.pregnancy;

		triggerEvent(ZLBFEventsEnum.IMAGE);

		ui[ZLBFUIElements.womb.sperm.current.amount]?.setText(valueInMilliliters(amount));
		ui[ZLBFUIElements.womb.sperm.total.amount]?.setText(valueInMilliliters(total));
		ui[ZLBFUIElements.womb.image]?.setPath(Animation.wombImage);
		ui[ZLBFUIElements.womb.cycle.phase.value]?.setText(getText(phaseTranslation));

		if (!context.player || Player.hasTrait(context.player, ZLBFTraitsEnum.INFERTILE)) {
			return;
		}

		const title = getText(`IGUI_ZLBF_UI_${pregnancy ? "Pregnancy" : "Fertility"}`);
		const progress = pregnancy ? pregnancy.progress : fertility;

		ui[ZLBFUIElements.womb.fertility.title]?.setText(title);
		ui[ZLBFUIElements.womb.fertility.bar]?.setValue(progress);
		ui[ZLBFUIElements.womb.fertility.value]?.setText(`${Math.floor(progress * 100)}%`);
	}
}
