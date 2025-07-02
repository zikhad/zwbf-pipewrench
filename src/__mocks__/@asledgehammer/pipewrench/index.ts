/* eslint-disable @typescript-eslint/no-explicit-any */

import { mock } from "jest-mock-extended";
import { Trait } from "@asledgehammer/pipewrench";

export const getPlayer = jest.fn();
export const getSpecificPlayer = jest.fn();

export const ZombRandFloat = (a: number) => a;
export const ZombRand = (a: number) => a;
export const isDebugEnabled = jest.fn();

export const BodyPartType = {
	Groin: "Groin",
	Torso_Upper: "Torso_Upper"
};

export const getText = jest.fn().mockImplementation((...args: string[]) => args.join());

export const triggerEvent = jest.fn();

export const getActivatedMods = jest.fn();

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
	derive() {}
	setActionAnim() {}
	setOverrideHandModels() {}
	getJobDelta() {
		return null as never;
	}
	isValid() {
		return null as never;
	}
	start() {}
	stop() {}
	update() {}
	perform() {}
}

export class BaseCharacterSoundEmitter {
	isPlaying() {
		return null as never;
	}
	stopSoundByName() {}
}

export class GameTime {
	static getInstance() {
		return {
			getHour: () => jest.fn()
		};
	}
}

export class HaloTextHelper {
	static addTextWithArrow() {}
	static addText() {}
	static getColorGreen() {
		return "green";
	}
	static getColorRed() {
		return "red";
	}
	static getColorWhite() {
		return "white";
	}
}

export const getGametimeTimestamp = jest.fn();

(globalThis as any).table = {
	insert: jest.fn((arr, fn) => arr.push(fn))
};
(globalThis as any).string = {
	find: (subject: string, value: string) => subject.includes(value)
};

export enum CharacterActionAnims {
	TakePills = "TakePills"
}
