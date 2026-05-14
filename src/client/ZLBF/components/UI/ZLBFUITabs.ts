
export { ZLBFUITabContext, ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";
export { ZLBFUIElements } from "@client/components/UI/ZLBFUIElements";
export { LactationTab } from "@client/components/UI/tabs/LactationTab";
export { WombTab } from "@client/components/UI/tabs/WombTab";

import { ZLBFUITabDefinition } from "@client/components/UI/ZLBFUITabDefinition";
import { LactationTab } from "@client/components/UI/tabs/LactationTab";
import { WombTab } from "@client/components/UI/tabs/WombTab";

/**
 * Default set of ZLBF UI tabs (order matters).
 */
export const defaultZLBFUITabs: ZLBFUITabDefinition[] = [
	new WombTab(),
	new LactationTab()
];
