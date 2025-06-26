import { mock } from "jest-mock-extended";
import { Trait } from "@asledgehammer/pipewrench";

export const getPlayer = jest.fn();

export const ZombRandFloat = (a: number) => a;
export const ZombRand = (a: number) => a;

export const BodyPartType = {
	Groin: "Groin",
	Torso: "Torso"
};

export const getText = jest.fn().mockImplementation((...args: string[]) => args.join());

export const triggerEvent = jest.fn();

// export const require = jest.fn();

export class TraitFactory {
	static addTrait() {
		return mock<Trait>({
			addXPBoost: jest.fn()
		});
	}
}

export class LuaEventManager {
	static AddEvent() {
		return mock<Event>();
	}
}

export class ISBaseTimedAction {
	isValid() { return null as never; }
	start() {}
	stop() {}
	update() {}
	perform() {}
}