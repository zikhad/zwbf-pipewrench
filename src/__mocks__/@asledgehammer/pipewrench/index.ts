import { mock } from "jest-mock-extended";
import { Trait } from "@asledgehammer/pipewrench";

export const getPlayer = jest.fn();

export const ZombRandFloat = jest.fn();
export const ZombRand = jest.fn().mockImplementation((a: number) => a);

export const getText = jest.fn().mockImplementation((...args: string[]) => args.join());


export const triggerEvent = jest.fn();

export class TraitFactory {
	static addTrait() {
		return mock<Trait>({
			addXPBoost: jest.fn()
		});
	}
}

export class LuaEventManager {
	static AddEvent() { return mock<Event>() };
}