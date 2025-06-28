import { mock } from "jest-mock-extended";
import { ZWBFFeedBaby } from "./ZWBFFeedBaby";
import * as SpyPipewrench from "@asledgehammer/pipewrench";
import { ISBaseTimedAction, AlarmClock, IsoGameCharacter, ItemContainer, BaseCharacterSoundEmitter } from "@asledgehammer/pipewrench";
import { Lactation } from "../components/Lactation";

jest.mock("@asledgehammer/pipewrench");

describe("ZWBFFeedBaby", () => {
    
    let action: ZWBFFeedBaby;
    const spySoundIsPlaying = jest.fn().mockImplementation(() => true);
    const spyStopSoundByName = jest.fn();
    
    const player = mock<IsoGameCharacter>( { 
        getInventory: () => mock<ItemContainer>({ contains: () => true }),
        getEmitter: () => mock<BaseCharacterSoundEmitter>({
            isPlaying: spySoundIsPlaying,
            stopSoundByName: spyStopSoundByName
        })
    });
    
    const lactation = mock<Lactation>();
    
    
    const baby = mock<AlarmClock>({
        getModData: jest.fn().mockImplementation(() => ({
            feedTime: 1200
        })),
        isRinging: () => true,
    });

    const spyTriggerEvent = jest.spyOn(SpyPipewrench, 'triggerEvent');
    
    beforeEach(() => {
        jest.spyOn(SpyPipewrench, 'getGametimeTimestamp').mockImplementation(() => 0);
        action = new ZWBFFeedBaby(lactation, baby);
        action.character = player
    });
    
    it("isValid should be true", () => {
        expect(action.isValid()).toBe(true);
    });
    
    it("Start should set action anim", () => {
        const spy = jest.spyOn(ISBaseTimedAction.prototype, "setActionAnim");
        action.start()
        expect(spy).toHaveBeenCalled();
    });
    
    it("Update should trigger setJobDelta on baby item", () => {
        const spy = jest.spyOn(baby, 'setJobDelta');
        action.update()
        expect(spy).toHaveBeenCalled();
    });
    
    it("Perform should call useMilk", () => {
        const spy = jest.spyOn(lactation, 'useMilk');
        action.perform();
        expect(spy).toHaveBeenCalled();
    });
});