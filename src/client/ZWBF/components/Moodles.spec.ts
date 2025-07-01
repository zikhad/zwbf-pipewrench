import { mock } from "jest-mock-extended";
import { Moodle } from "./Moodles";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { IsoPlayer, ArrayList } from "@asledgehammer/pipewrench";

// jest.mock("MF_ISMoodle");
describe("Moodles", () => {
    const player = mock<IsoPlayer>();
    const createMoodle = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(SpyPipewrench, "require", {
            value: jest.fn(),
            writable: true
        });
        (globalThis as any).MF = {
            createMoodle,
            getMoodle: jest.fn(() => ({
                setPicture: jest.fn(),
                getGoodBadNeutral: jest.fn(),
                getLevel: jest.fn()
            }))
        };
        jest.spyOn(SpyPipewrench, 'getActivatedMods').mockImplementation(() => mock<ArrayList>({
            contains: jest.fn().mockImplementation(() => true)
        }));
    });
    it("should create a Moodle instance with correct properties", () => {
        const moodle = new Moodle({
            name: "TestMoodle",
            player,
            texture: "test_texture.png",
            type: "Good",
            tresholds: [0, 0.25, 0.5, 0.75]
        });
        expect(moodle).toBeDefined();
        expect(createMoodle).toHaveBeenCalledWith("TestMoodle");
    });

});