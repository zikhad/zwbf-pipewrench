import { getText, IsoPlayer, triggerEvent, require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { ZWBFEventsEnum, ZWBFTraitsEnum } from "@constants";
import { Lactation } from "../Lactation";
import { Pregnancy } from "../Pregnancy";
import { Womb } from "../Womb";
import { Player } from "../Player";
import { Animation } from "@client/components/Animation";

const TAB_TITLE = "ZWBF";

type UIProps = {
	lactation: Lactation;
	pregnancy: Pregnancy;
	womb: Womb;
};

type CharacterInfoWindowLike = {
	panel?: {
		addView?: (name: string, view: unknown) => void;
		getView?: (name: string) => unknown;
		width?: number;
	};
	width?: number;
	height?: number;
	createChildren?: (...args: unknown[]) => void;
	__zwbfTabAdded?: boolean;
	zwbfView?: unknown;
};

export interface ZWBFHealthTabViewFactory {
	create(window: CharacterInfoWindowLike): ZWBFSimplePanel;
}

export class ZWBFEmbeddedHealthTabViewFactory implements ZWBFHealthTabViewFactory {
	public create(window: CharacterInfoWindowLike): ZWBFSimplePanel {
		pipewrenchRequire("ZWBF/ZWBFSimpleUI");
		const globals = globalThis as { NewZWBFPanel?: (x: number, y: number, w: number, h: number) => ZWBFSimplePanel };
		if (!globals.NewZWBFPanel) return {} as ZWBFSimplePanel;
		const width = window.panel?.width ?? window.width ?? 400;
		const height = (window.height ?? 400) - 8;
		return globals.NewZWBFPanel(0, 8, width, height);
	}
}

export class ZWBFHealthTabInjector {
	private isInstalled = false;
	private panel?: ZWBFSimplePanel;
	private player?: IsoPlayer;
	private hasBuiltPanel = false;

	private readonly UIElements = {
		lactation: {
			image: "tab-lactation-image",
			title: "tab-lactation-level-title",
			level: "tab-lactation-level-image"
		},
		womb: {
			title: "tab-womb-title",
			image: "tab-womb-image",
			sperm: {
				current: {
					title: "tab-womb-sperm-current-title",
					amount: "tab-womb-sperm-current-amount"
				},
				total: {
					title: "tab-womb-sperm-total-title",
					amount: "tab-womb-sperm-total-amount"
				}
			},
			cycle: {
				title: "tab-womb-cycle-title",
				phase: {
					title: "tab-womb-cycle-phase-title",
					value: "tab-womb-cycle-phase-value"
				}
			},
			fertility: {
				title: "tab-womb-fertility-title",
				bar: "tab-womb-fertility-bar",
				value: "tab-womb-fertility-value"
			}
		}
	};

	constructor(
		private readonly props: UIProps,
		private readonly viewFactory: ZWBFHealthTabViewFactory = new ZWBFEmbeddedHealthTabViewFactory()
	) {
		Events.onCreateUI.addListener(() => this.install());
		Events.onCreatePlayer.addListener((_, player) => this.onCreatePlayer(player));
		Events.onPostRender.addListener(() => this.onUpdateUI());
	}

	public install(): void {
		if (this.isInstalled) return;

		const globals = globalThis as {
			ISCharacterInfoWindow?: CharacterInfoWindowLike;
		};
		const characterInfoWindow = globals.ISCharacterInfoWindow;
		if (!characterInfoWindow?.createChildren) return;

		const originalCreateChildren = characterInfoWindow.createChildren;
		const factory = this.viewFactory;
		const injector = this;

		characterInfoWindow.createChildren = function(this: CharacterInfoWindowLike, ...args: unknown[]) {
			originalCreateChildren.call(this, ...args);
			if (!this.panel?.addView || this.__zwbfTabAdded) return;
			if (this.panel.getView?.(TAB_TITLE)) {
				this.__zwbfTabAdded = true;
				return;
			}

			const view = factory.create(this);
			injector.panel = view;
			injector.buildPanelIfReady();
			this.zwbfView = view;
			this.panel.addView(TAB_TITLE, view);
			this.__zwbfTabAdded = true;
		};

		this.isInstalled = true;
	}

	private label(txt: string): string {
		return `${getText(txt)}:`;
	}

	private onCreatePlayer(player: IsoPlayer): void {
		this.player = player;
		this.buildPanelIfReady();
	}

	private buildPanelIfReady(): void {
		if (this.hasBuiltPanel || !this.panel || !this.player?.isFemale()) return;

		const panel = this.panel;

		// === Womb ===
		panel.addText(this.UIElements.womb.title, this.label("IGUI_ZWBF_UI_Womb_title"), undefined, "Center");
		panel.nextLine();
		panel.addImage(this.UIElements.womb.image, "media/ui/womb/normal/womb_normal_0.png");
		panel.nextLine();
		panel.addText(this.UIElements.womb.sperm.current.title, this.label("IGUI_ZWBF_UI_Current"), undefined, "Center");
		panel.addText(this.UIElements.womb.sperm.current.amount, "0 ml", undefined, "Center");
		panel.nextLine();
		panel.addText(this.UIElements.womb.sperm.total.title, this.label("IGUI_ZWBF_UI_Total"), undefined, "Center");
		panel.addText(this.UIElements.womb.sperm.total.amount, "0 ml", undefined, "Center");
		panel.nextLine();
		panel.addText(this.UIElements.womb.cycle.title, getText("IGUI_ZWBF_UI_Cycle"), undefined, "Center");
		panel.nextLine();
		panel.addText(this.UIElements.womb.cycle.phase.title, this.label("IGUI_ZWBF_UI_Phase"), undefined, "Center");
		panel.addText(this.UIElements.womb.cycle.phase.value, "", undefined, "Center");
		panel.nextLine();

		if (!Player.hasTrait(this.player, ZWBFTraitsEnum.INFERTILE)) {
			panel.addText(this.UIElements.womb.fertility.title, this.label("IGUI_ZWBF_UI_Fertility"), undefined, "Center");
			panel.addProgressBar(this.UIElements.womb.fertility.bar, 0, 0, 1);
			panel.addText(this.UIElements.womb.fertility.value, "", undefined, "Center");
			panel.nextLine();
		}

		// === Milk ===
		panel.addText("", getText("IGUI_ZWBF_UI_Milk_title"), undefined, "Center");
		panel.nextLine();
		panel.addImage(this.UIElements.lactation.image, "media/ui/lactation/boobs/color-0/normal_empty.png");
		panel.nextLine();
		panel.addText(this.UIElements.lactation.title, this.label("IGUI_ZWBF_UI_Milk_Amount"), undefined, "Center");
		panel.addImage(this.UIElements.lactation.level, "media/ui/lactation/level/milk_level_0.png");

		panel.setBorderToAllElements(true);
		panel.saveLayout();
		this.hasBuiltPanel = true;
	}

	private hasRequiredElements(): boolean {
		const panel = this.panel as (ZWBFSimplePanel & Record<string, unknown>) | undefined;
		if (!panel) return false;

		return Boolean(
			panel[this.UIElements.lactation.image] &&
			panel[this.UIElements.lactation.level] &&
			panel[this.UIElements.womb.sperm.current.amount] &&
			panel[this.UIElements.womb.sperm.total.amount] &&
			panel[this.UIElements.womb.image] &&
			panel[this.UIElements.womb.cycle.phase.value]
		);
	}

	private onUpdateUI(): void {
		if (!this.panel || !this.props.lactation || !this.props.womb || !this.props.pregnancy) return;
		if (!this.player?.isFemale()) return;
		if (!this.hasBuiltPanel || !this.hasRequiredElements()) return;

		const panel = this.panel;

		// Lactation
		const { breasts, level } = this.props.lactation.images;
		panel[this.UIElements.lactation.image].setPath(breasts);
		panel[this.UIElements.lactation.level].setPath(level);

		// Womb
		const { phaseTranslation, fertility, amount, total } = this.props.womb;
		const { pregnancy } = this.props.pregnancy;
		const amountInMilliliters = Math.round(amount * 1000);
		const totalInMilliliters = Math.round(total * 1000);

		triggerEvent(ZWBFEventsEnum.IMAGE);

		panel[this.UIElements.womb.sperm.current.amount].setText(`${amountInMilliliters} ml`);
		panel[this.UIElements.womb.sperm.total.amount].setText(`${totalInMilliliters} ml`);
		panel[this.UIElements.womb.image].setPath(Animation.wombImage);
		panel[this.UIElements.womb.cycle.phase.value].setText(getText(phaseTranslation));

		if (!Player.hasTrait(this.player, ZWBFTraitsEnum.INFERTILE)) {
			const title = getText(`IGUI_ZWBF_UI_${pregnancy ? "Pregnancy" : "Fertility"}`);
			const progress = pregnancy ? pregnancy.progress : fertility;

			panel[this.UIElements.womb.fertility.title].setText(title);
			panel[this.UIElements.womb.fertility.bar].setValue(progress);
			panel[this.UIElements.womb.fertility.value].setText(`${Math.floor(progress * 100)}%`);
		}
	}
}
