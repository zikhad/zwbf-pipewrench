
import { ZLBFUITabContext, ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";
import { LactationTab } from "@client/components/UI/tabs/LactationTab";
import { WombTab } from "@client/components/UI/tabs/WombTab";

export { ZLBFUITabContext, ZLBFUITabDefinition, LactationTab, WombTab };

/**
 * Default set of ZLBF UI tabs (order matters).
 */
export const defaultZLBFUITabs: ZLBFUITabDefinition[] = [
	new WombTab(),
	new LactationTab()
];
