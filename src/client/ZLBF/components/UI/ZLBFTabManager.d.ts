/** @noResolution */
/**
 * This class is responsible to add a new Tab into the `Health` menu.
 * It's implementation is done throught lua
 */
declare module "@client/components/UI/ZLBFTabManager" {
	export class ZLBFTabManager {
		/**
		 * Add a new Tab into `Health` Menu
		 * @param tabName Name of the new tab
		 * @param ui UI element
		 */
		addTab(tabName: string, ui: unknown): void;
		static new(): ZLBFTabManager;
	}
}
