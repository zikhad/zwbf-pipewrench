import { getText, IsoPlayer, triggerEvent, require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZLBFEventsEnum, ZLBFTraitsEnum } from "@constants";
import { Lactation } from "@client/components/Lactation";
import { Pregnancy } from "@client/components/Pregnancy";
import { Womb } from "@client/components/Womb";
import { Player } from "@client/components/Player";
import { Animation } from "@client/components/Animation";

type UIProps = {
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
};

export class ZLBFUI {
	private readonly UIElements = {
		lactation: {
			image: "lactation-image",
			title: "lactation-level-title",
			level: "lactation-level-image"
		},
		womb: {
			title: "womb-title",
			image: "womb-image",
			sperm: {
				current: {
					title: "womb-sperm-current-title",
					amount: "womb-sperm-current-amount"
				},
				total: {
					title: "womb-sperm-total-title",
					amount: "womb-sperm-total-amount"
				}
			},
			cycle: {
				title: "womb-cycle-title",
				phase: {
					title: "womb-cycle-phase-title",
					value: "womb-cycle-phase-value"
				}
			},
			fertility: {
				title: "womb-fertility-title",
				bar: "womb-fertility-bar",
				value: "womb-fertility-value"
			}
		}
	};

	private player?: IsoPlayer;
	private readonly lactation?: Lactation;
	private readonly pregnancy?: Pregnancy;
	private readonly womb?: Womb;

	private UI?: ZLBFTabbedUI;

	constructor(props: UIProps) {
		this.lactation = props.lactation;
		this.pregnancy = props.pregnancy;
		this.womb = props.womb;

		Events.onCreateUI.addListener(() => this.onCreateUI());
		Events.onCreatePlayer.addListener((_, player) => this.onCreatePlayer(player));
		Events.onPostRender.addListener(() => this.onUpdateUI());
	}

	private label(txt: string): string {
		return `${getText(txt)}:`;
	}

	private onCreatePlayer(player: IsoPlayer) {
		this.player = player;
		if (!this.UI) return;
		if (!this.player?.isFemale()) return;

		this.UI.setActiveTab(this.label("IGUI_ZLBF_UI_Womb_title"));
		this.UI.nextLine();
		this.UI.addImage(this.UIElements.womb.image, "media/ui/womb/normal/womb_normal_0.png");
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.sperm.current.title,
			this.label("IGUI_ZLBF_UI_Current"),
			undefined,
			"Center"
		);
		this.UI.addText(this.UIElements.womb.sperm.current.amount, "0 ml", undefined, "Center");
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.sperm.total.title,
			this.label("IGUI_ZLBF_UI_Total"),
			undefined,
			"Center"
		);
		this.UI.addText(this.UIElements.womb.sperm.total.amount, "0 ml", undefined, "Center");
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.cycle.title,
			getText("IGUI_ZLBF_UI_Cycle"),
			undefined,
			"Center"
		);
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.cycle.phase.title,
			this.label("IGUI_ZLBF_UI_Phase"),
			undefined,
			"Center"
		);
		this.UI.addText(this.UIElements.womb.cycle.phase.value, "", undefined, "Center");
		this.UI.nextLine();

		if (!Player.hasTrait(this.player, ZLBFTraitsEnum.INFERTILE)) {
			this.UI.addText(
				this.UIElements.womb.fertility.title,
				this.label("IGUI_ZLBF_UI_Fertility"),
				undefined,
				"Center"
			);
			this.UI.addProgressBar(this.UIElements.womb.fertility.bar, 0, 0, 1);
			this.UI.addText(this.UIElements.womb.fertility.value, "", undefined, "Center");
			this.UI.nextLine();
		}

		this.UI.setActiveTab(this.label("IGUI_ZLBF_UI_Lactation_title"));
		this.UI.addImage(
			this.UIElements.lactation.image,
			"media/ui/lactation/boobs/color-0/normal_empty.png"
		);
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.lactation.title,
			this.label("IGUI_ZLBF_UI_Milk_Amount"),
			undefined,
			"Center"
		);
		this.UI.addImage(
			this.UIElements.lactation.level,
			"media/ui/lactation/level/milk_level_0.png"
		);

		this.UI.setBorderToAllElements(true);
		this.UI.saveLayout();
		this.UI.setActiveTab("Womb");
	}

	private onCreateUI() {
		pipewrenchRequire("ZLBF/ZLBFTabbedUI");
		this.UI = NewZLBFTabbedUI();

		this.UI.setWidthPixel(200);
		this.UI.setTitle(getText("IGUI_ZLBF_UI_Panel"));
		this.UI.close();
	}

	private onUpdateUI() {
		if (
			!this.UI?.isUIVisible ||
			!this.lactation ||
			!this.womb ||
			!this.pregnancy
		)
			return;

		const lactationImage = this.UI[this.UIElements.lactation.image];
		const lactationLevel = this.UI[this.UIElements.lactation.level];
		if (lactationImage !== undefined && lactationLevel !== undefined) {
			const { breasts, level } = this.lactation.images;
			lactationImage.setPath(breasts);
			lactationLevel.setPath(level);
		}

		const { phaseTranslation, fertility, amount, total } = this.womb;
		const { pregnancy } = this.pregnancy;
		const amountInMilliliters = Math.round(amount * 1000);
		const totalInMilliliters = Math.round(total * 1000);

		triggerEvent(ZLBFEventsEnum.IMAGE);

		const spermCurrent = this.UI[this.UIElements.womb.sperm.current.amount];
		const spermTotal = this.UI[this.UIElements.womb.sperm.total.amount];
		const wombImage = this.UI[this.UIElements.womb.image];
		const phaseValue = this.UI[this.UIElements.womb.cycle.phase.value];
		if (spermCurrent !== undefined) spermCurrent.setText(`${amountInMilliliters} ml`);
		if (spermTotal !== undefined) spermTotal.setText(`${totalInMilliliters} ml`);
		if (wombImage !== undefined) wombImage.setPath(Animation.wombImage);
		if (phaseValue !== undefined) phaseValue.setText(getText(phaseTranslation));

		if (!Player.hasTrait(this.player, ZLBFTraitsEnum.INFERTILE)) {
			const title = getText(`IGUI_ZLBF_UI_${pregnancy ? "Pregnancy" : "Fertility"}`);
			const progress = pregnancy ? pregnancy.progress : fertility;

			const fertilityTitle = this.UI[this.UIElements.womb.fertility.title];
			const fertilityBar = this.UI[this.UIElements.womb.fertility.bar];
			const fertilityValue = this.UI[this.UIElements.womb.fertility.value];
			if (fertilityTitle !== undefined) fertilityTitle.setText(title);
			if (fertilityBar !== undefined) fertilityBar.setValue(progress);
			if (fertilityValue !== undefined) fertilityValue.setText(`${Math.floor(progress * 100)}%`);
		}
	}

	public toggle() {
		if (!this.UI) return;
		this.UI.toggle();
	}

	public isVisible(): boolean {
		if (!this.UI) {
			return false;
		}

		return this.UI.isUIVisible;
	}
}
