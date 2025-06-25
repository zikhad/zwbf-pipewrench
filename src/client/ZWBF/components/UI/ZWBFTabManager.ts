import { getText } from "@asledgehammer/pipewrench";
import { ISCharacterInfoWindow, ISWindow, ISLayoutManager } from "@asledgehammer/pipewrench/client";

interface TabInfo {
	viewName: string;
	ui: any; // You can make this more specific based on your UI components
}
interface Layout {
	tabs?: string;
	current?: string;
	[key: string]: any;
}
export class ZWBFTabManager {
	private static tabs: Record<string, TabInfo> = {};
	private static methodsOverridden = false;

	/**
	 * Adds a new tab to the character info window
	 * @param tabName The name for the tab
	 * @param ui UI component to show
	 */
	static addTab(tabName: string, ui: any): void {
		const viewName = `${tabName}View`;

		// Store tab information
		ZWBFTabManager.tabs[tabName] = {
			viewName,
			ui
		};

		// Override methods only once
		if (!ZWBFTabManager.methodsOverridden) {
			ZWBFTabManager.overrideISCharacterInfoWindowMethods();
			ZWBFTabManager.methodsOverridden = true;
		}
	}

	/**
	 * Overrides necessary methods in ISCharacterInfoWindow
	 */
	private static overrideISCharacterInfoWindowMethods(): void {
		// Store original methods
		const originalCreateChildren = ISCharacterInfoWindow.prototype.createChildren;
		const originalOnTabTornOff = ISCharacterInfoWindow.prototype.onTabTornOff;
		const originalPrerender = ISCharacterInfoWindow.prototype.prerender;
		const originalSaveLayout = ISCharacterInfoWindow.prototype.SaveLayout;

		// Extend createChildren
		ISCharacterInfoWindow.prototype.createChildren = function () {
			originalCreateChildren.call(this);

			for (const [tabName, tabInfo] of Object.entries(ZWBFTabManager.tabs)) {
				const viewName = tabInfo.viewName;
				const ui = tabInfo.ui;

				(this as any)[viewName] = ui;
				(this as any)[viewName].setPositionPixel(0, 0);
				(this as any)[viewName].infoText = getText(`UI_${tabName}_Info`);
				(this as any)[viewName].closeButton.setVisible(false);

				// Prevent the tab content from being dragged
				(this as any)[viewName].onMouseDown = () => {
					(this as any)[viewName].setX(0);
					(this as any)[viewName].setY((ISWindow as any).TitleBarHeight);
				};

				this.panel.addView(getText(`UI_${tabName}`), (this as any)[viewName]);
			}
		};

		// Extend onTabTornOff
		ISCharacterInfoWindow.prototype.onTabTornOff = function (view: any, window: any) {
			for (const [tabName, tabInfo] of Object.entries(ZWBFTabManager.tabs)) {
				if (this.playerNum === 0 && view === (this as any)[tabInfo.viewName]) {
					ISLayoutManager.RegisterWindow(`charinfowindow.${tabName}`, ISCharacterInfoWindow, window);
				}
			}
			originalOnTabTornOff.call(this, view, window);
		};

		// Extend prerender
		ISCharacterInfoWindow.prototype.prerender = function () {
			originalPrerender.call(this);

			for (const tabInfo of Object.values(ZWBFTabManager.tabs)) {
				const viewName = tabInfo.viewName;
				if ((this as any)[viewName] === this.panel.getActiveView()) {
					this.setWidth((this as any)[viewName].getWidth());
					this.setHeight(((ISWindow as any).TitleBarHeight * 2) + (this as any)[viewName].getHeight());
				}
			}
		};

		// Extend SaveLayout
		ISCharacterInfoWindow.prototype.SaveLayout = function (name: string, layout: Layout) {
			originalSaveLayout.call(this, name, layout);

			for (const [tabName, tabInfo] of Object.entries(ZWBFTabManager.tabs)) {
				const subSelf = (this as any)[tabInfo.viewName];
				if (subSelf && subSelf.parent === this.panel) {
					if (!layout.tabs) {
						layout.tabs = tabName;
					} else {
						layout.tabs = `${layout.tabs},${tabName}`;
					}
					if (subSelf === this.panel.getActiveView()) {
						layout.current = tabName;
					}
				}
			}
		};
	}
}
