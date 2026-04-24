import { getText, IsoPlayer, triggerEvent, require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZLBFEventsEnum, ZLBFTraitsEnum } from "@constants";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { Player } from "./Player";
import { Animation } from "@client/components/Animation";
// import { ZLBFTabManager } from "@client/components/UI/ZLBFTabManager";

type UIProps = {
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
	// tabManager?: ZLBFTabManager;
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

	private UI?: ZLBFSimpleUI;

	// private readonly tabManager: ZLBFTabManager;

	private activePanels = {
		lactation: true,
		womb: true
	};
	private heights = {
		lactation: 0,
		womb: 0
	};

	constructor(props: UIProps) {
		this.lactation = props.lactation;
		this.pregnancy = props.pregnancy;
		this.womb = props.womb;
		// this.tabManager = props.tabManager || ZLBFTabManager.new();
		Events.onCreateUI
			.addListener(() => this.onCreateUI());
		Events.onCreatePlayer
			.addListener((_, player) => this.onCreatePlayer(player));
		Events.onPostRender
			.addListener(() => this.onUpdateUI());
	}

	private label(txt: string): string {
		return `${getText(txt)}:`;
	}
	
	private toggleLactationPanel() {
		// if (!this.UI) return;
		this.activePanels.lactation = !this.activePanels.lactation;
		for (const element of Object.values(this.UIElements.lactation)) {
			if (this.UI![element]) {
				this.UI![element].setVisible(this.activePanels.lactation);
			}
		}
		if (this.activePanels.lactation) {
			this.UI!.setHeight(this.heights.lactation);
		} else {
			this.UI!.setHeight(this.heights.womb);
		}
	}
	
	private onCreatePlayer(player: IsoPlayer) {
		this.player = player;
		if (!this.UI) return;
		if (!this.player?.isFemale()) return;

		// === Womb ===
		this.UI.addText(
			this.UIElements.womb.title,
			this.label("IGUI_ZLBF_UI_Womb_title"),
			undefined,
			"Center"
		);
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
		// The height of the womb UI needs to take in consideration the title bar height
		this.heights.womb = this.UI.yAct + this.UI.titleBarHeight();

		// === Milk ===
		// controls
		this.UI.addText("", getText("IGUI_ZLBF_UI_Milk_title"), undefined, "Center");
		this.UI.addButton("", getText("IGUI_ZLBF_UI_Milk_toggle"), () =>
			this.toggleLactationPanel()
		);
		this.UI.nextLine();

		// Lactation UI
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

		// The height of the lactation UI needs to take in consideration the title bar height
		this.heights.lactation = this.UI.yAct + this.UI.titleBarHeight() * 2;

		this.UI.setBorderToAllElements(true);
		this.UI.saveLayout();
	}

	private onCreateUI() {
		pipewrenchRequire("ZLBF/ZLBFSimpleUI");
		this.UI = NewZLBFUI();

		this.UI.setWidthPixel(200);
		this.UI.setTitle(getText("IGUI_ZLBF_UI_Panel"));
		this.UI.close();
		// this.tabManager.addTab("HPanel", this.UI);
	}

	private onUpdateUI() {
		// Update UI elements here
		if (
			!this.UI?.isUIVisible ||
			!this.lactation ||
			!this.womb ||
			!this.pregnancy
		) return;

		// lactation
		if (this.activePanels.lactation) {
			const { breasts, level } = this.lactation.images;
			this.UI[this.UIElements.lactation.image].setPath(breasts);
			this.UI[this.UIElements.lactation.level].setPath(level);
		}

		// Womb
		const { phaseTranslation, fertility, amount, total } = this.womb;
		const { pregnancy } = this.pregnancy;
		const amountInMilliliters = Math.round(amount * 1000);
		const totalInMilliliters = Math.round(total * 1000);

		triggerEvent(ZLBFEventsEnum.IMAGE);

		this.UI[this.UIElements.womb.sperm.current.amount].setText(`${amountInMilliliters} ml`);
		this.UI[this.UIElements.womb.sperm.total.amount].setText(`${totalInMilliliters} ml`);
		this.UI[this.UIElements.womb.image].setPath(Animation.wombImage);
		this.UI[this.UIElements.womb.cycle.phase.value].setText(getText(phaseTranslation));

		if (!Player.hasTrait(this.player, ZLBFTraitsEnum.INFERTILE)) {
			const title = getText(`IGUI_ZLBF_UI_${pregnancy ? "Pregnancy" : "Fertility"}`);
			const progress = pregnancy ? pregnancy.progress : fertility;

			this.UI[this.UIElements.womb.fertility.title].setText(title);
			this.UI[this.UIElements.womb.fertility.bar].setValue(progress);
			this.UI[this.UIElements.womb.fertility.value].setText(`${Math.floor(progress * 100)}%`);
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
