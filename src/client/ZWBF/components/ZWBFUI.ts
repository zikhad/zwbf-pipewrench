import { getText, IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZWBFTraitsEnum } from "@constants";
import { Lactation } from "./Lactation";
import { Pregnancy } from "./Pregnancy";
import { Womb } from "./Womb";
import { ZWBFTabManager } from "@client/components/UI/ZWBFTabManager";

type ZWBFUIProps = {
	// player. IsoPlayer;
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
	tabManager?: ZWBFTabManager;
};
export class ZWBFUI {
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
	private lactation?: Lactation;
	private pregnancy?: Pregnancy;
	private womb?: Womb;

	private UI?: SimpleUI;

	private readonly tabManager: ZWBFTabManager;

	private activePanels = {
		lactation: true,
		womb: true
	};
	private heights = {
		lactation: 0,
		womb: 0
	};

	constructor(props: ZWBFUIProps) {
		this.lactation = props.lactation;
		this.pregnancy = props.pregnancy;
		this.womb = props.womb;
		this.tabManager = props.tabManager || new ZWBFTabManager();
		Events.onCreateUI.addListener(() => this.onCreateUI());
		Events.onPostRender.addListener(() => this.onUpdateUI());
		Events.onCreatePlayer.addListener((_, player) => this.onCreatePlayer(player));
	}

	private label(txt: string): string {
		return `${getText(txt)}:`;
	}
	private toggleLactationPanel() {
		if (!this.UI) return;
		this.activePanels.lactation = !this.activePanels.lactation;
		for (const element of Object.values(this.UIElements.lactation)) {
			if (this.UI[element]) {
				this.UI[element].setVisible(this.activePanels.lactation);
			}
		}
		if (this.activePanels.lactation) {
			this.UI.setHeight(this.heights.lactation);
		} else {
			this.UI.setHeight(this.heights.womb);
		}
	}
	onCreatePlayer(player: IsoPlayer) {
		this.player = player;
	}
	onCreateUI() {
		if (!this.player?.isFemale()) return;
		this.UI = NewUI();
		this.UI.setWidthPixel(200);
		this.UI.setTitle(getText("IGUI_ZWBF_UI_Panel"));

		// === Womb ===
		this.UI.addText(
			this.UIElements.womb.title,
			this.label("IGUI_ZWBF_UI_Womb_title"),
			undefined,
			"Center"
		);
		this.UI.nextLine();
		this.UI.addImage(this.UIElements.womb.image, "media/ui/womb/normal/womb_normal_0.png");
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.sperm.current.title,
			this.label("IGUI_ZWBF_UI_Current"),
			undefined,
			"Center"
		);
		this.UI.addText(this.UIElements.womb.sperm.current.amount, "0 ml", undefined, "Center");
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.sperm.total.title,
			this.label("IGUI_ZWBF_UI_Total"),
			undefined,
			"Center"
		);
		this.UI.addText(this.UIElements.womb.sperm.total.amount, "0 ml", undefined, "Center");
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.cycle.title,
			getText("IGUI_ZWBF_UI_Cycle"),
			undefined,
			"Center"
		);
		this.UI.nextLine();
		this.UI.addText(
			this.UIElements.womb.cycle.phase.title,
			this.label("IGUI_ZWBF_UI_Phase"),
			undefined,
			"Center"
		);
		this.UI.addText(this.UIElements.womb.cycle.phase.value, "", undefined, "Center");
		this.UI.nextLine();

		if (!this.player.HasTrait(ZWBFTraitsEnum.INFERTILE)) {
			this.UI.addText(
				this.UIElements.womb.fertility.title,
				this.label("IGUI_ZWBF_UI_Fertility"),
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
		this.UI.addText("", getText("IGUI_ZWBF_UI_Milk_title"), undefined, "Center");
		this.UI.addButton("", getText("IGUI_ZWBF_UI_Milk_toggle"), () =>
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
			this.label("IGUI_ZWBF_UI_Milk_Amount"),
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

		this.tabManager.addTab("HPanel", this.UI);
	}
	onUpdateUI() {
		// Update UI elements here
		if (
			!this.womb ||
			!this.lactation ||
			!this.pregnancy ||
			!this.UI ||
			!this.UI.isUIVisible ||
			!this.player ||
			!this.player.isFemale()
		)
			return;
		// lactation
		if (this.activePanels.lactation) {
			const { breasts, level } = this.lactation.images;
			this.UI[this.UIElements.lactation.image].setPath(breasts);
			this.UI[this.UIElements.lactation.level].setPath(level);
		}
		// Womb
		const { image, phaseTranslation, fertility, amount, total } = this.womb;
		const { pregnancy } = this.pregnancy;
		this.UI[this.UIElements.womb.sperm.current.amount].setText(string.format("%s ml", amount));
		this.UI[this.UIElements.womb.sperm.total.amount].setText(string.format("%s ml", total));
		this.UI[this.UIElements.womb.image].setPath(image);
		this.UI[this.UIElements.womb.cycle.phase.value].setText(getText(phaseTranslation));
		if (!this.player.HasTrait("Infertile")) {
			this.UI[this.UIElements.womb.fertility.title].setText(
				getText(`IGUI_ZWBF_UI_${pregnancy ? "Pregnancy" : "Fertility"}`)
			);
			this.UI[this.UIElements.womb.fertility.bar].setValue(
				pregnancy ? pregnancy.progress : fertility
			);
			this.UI[this.UIElements.womb.fertility.value].setText(
				`${math.floor(fertility * 100)}%`
			);
		}
	}
}
