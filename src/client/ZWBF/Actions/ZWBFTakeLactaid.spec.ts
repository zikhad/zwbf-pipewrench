import { mock } from "jest-mock-extended";
import { Lactation } from "../components/Lactation";
import { ZWBTakeLactaid } from "./ZWBFTakeLactaid";
import { InventoryItem } from "@asledgehammer/pipewrench";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@actions/ZWBFTakePills");

describe("ZWBTakeLactaid", () => {
    it("Perform should update lactation status", () => {
        const lactation = mock<Lactation>();
        const spyUseMilk = jest.spyOn(lactation, 'useMilk');
        const pills = mock<InventoryItem>();
        const action = new ZWBTakeLactaid(lactation, pills);
        action.perform();
        expect(lactation.useMilk).toHaveBeenCalled();
    });
});