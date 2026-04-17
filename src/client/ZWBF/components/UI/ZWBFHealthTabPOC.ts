import { getText, require as pipewrenchRequire } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";

const TAB_TITLE = "ZWBF";
const TAB_INFO_TEXT = "IGUI_ZWBF_UI_Panel";

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

type UIElementLike = {
	setVisible?: (visible: boolean) => void;
	initialise?: () => void;
	render?: () => void;
	drawTextCentre?: (...args: unknown[]) => void;
	width?: number;
	height?: number;
	infoText?: string;
};

export interface ZWBFHealthTabViewFactory {
	create(window: CharacterInfoWindowLike): UIElementLike;
}

export class ZWBFEmbeddedHealthTabViewFactory implements ZWBFHealthTabViewFactory {
	public create(window: CharacterInfoWindowLike): UIElementLike {
		pipewrenchRequire("ISUI/ISPanel");
		const globals = globalThis as {
			ISPanel?: { new?: (...args: unknown[]) => UIElementLike };
		};
		const panelCtor = globals.ISPanel;
		if (!panelCtor?.new) {
			return {};
		}

		const width = window.panel?.width ?? window.width ?? 400;
		const height = (window.height ?? 400) - 8;
		const view = panelCtor.new(panelCtor, 0, 8, width, height);
		if (view.initialise) {
			view.initialise();
		}

		const originalRender = view.render;
		view.render = function(this: UIElementLike) {
			if (originalRender) {
				originalRender.call(this);
			}
			if (this.drawTextCentre) {
				this.drawTextCentre(getText(TAB_INFO_TEXT), (this.width ?? 0) / 2, 20, 1, 1, 1, 1);
			}
		};
		view.infoText = getText(TAB_INFO_TEXT);
		return view;
	}
}

export class ZWBFHealthTabInjector {
	private isInstalled = false;

	constructor(private readonly viewFactory: ZWBFHealthTabViewFactory = new ZWBFEmbeddedHealthTabViewFactory()) {
		Events.onCreateUI.addListener(() => this.install());
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

		characterInfoWindow.createChildren = function(this: CharacterInfoWindowLike, ...args: unknown[]) {
			originalCreateChildren.call(this, ...args);
			if (!this.panel?.addView || this.__zwbfTabAdded) return;
			if (this.panel.getView?.(TAB_TITLE)) {
				this.__zwbfTabAdded = true;
				return;
			}

			const view = factory.create(this);
			this.zwbfView = view;
			this.panel.addView(TAB_TITLE, view);
			this.__zwbfTabAdded = true;
		};

		this.isInstalled = true;
	}
}
