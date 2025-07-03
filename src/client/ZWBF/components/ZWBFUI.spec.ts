import { mock } from "jest-mock-extended";
import { ZWBFUI } from "./ZWBFUI";
import * as Events from "@asledgehammer/pipewrench-events";

jest.mock("@client/components/UI/ZWBFTabManager", () => ({
  ZWBFTabManager: class {
        constructor() {}
    }
}));

describe("ZWBFUI", () => {
    const ui = new ZWBFUI({
        lactation: mock(),
        pregnancy:mock(),
        womb: mock()
    });
    it("should work", () => {
        expect(ui).toBeDefined();
    });
});