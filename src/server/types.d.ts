import { IsoGameCharacter } from "@asledgehammer/pipewrench";

interface FluidContainer {
	removeFluid(): void;
	addFluid(type: any, amount: number): void;
	getCapacity(): number;
}

interface FluidContainerItem {
	getFluidContainer(): FluidContainer;
}

export type Recipe = {
	OnTest: Record<string, (item: unknown, character: IsoGameCharacter) => boolean>;
	OnCreate: Record<string, (items: any, character: IsoGameCharacter) => void>;
};