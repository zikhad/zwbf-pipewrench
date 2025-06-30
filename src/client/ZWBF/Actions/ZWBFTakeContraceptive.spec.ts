import { mock } from "jest-mock-extended";
import { Womb } from "@client/components/Womb";
import { ZWBTakeContraceptive } from "./ZWBFTakeContraceptive";
import { InventoryItem } from "@asledgehammer/pipewrench";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@actions/ZWBFTakePills");

describe("ZWBFTakeContraceptive", () => {
	it("Perform should set contraceptive status", () => {
		const womb = mock<Womb>({ contraceptive: true });
		jest.replaceProperty(womb, "contraceptive", false);
		const pills = mock<InventoryItem>();
		const action = new ZWBTakeContraceptive(womb, pills);
		action.perform();
		expect(womb.contraceptive).toBe(true);
	});
});
