import { mock } from "jest-mock-extended";
import { Trait } from "@asledgehammer/pipewrench";

export const getPlayer = jest.fn();

export const ZombRandFloat = jest.fn();
export const ZombRand = jest.fn();

export const getText = jest.fn().mockImplementation((...args: string[]) => args.join());

export class TraitFactory {
	static addTrait() {
		return mock<Trait>({
			addXPBoost: jest.fn()
		});
	}
}