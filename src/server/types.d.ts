import { ArrayList, InventoryItem, IsoGameCharacter } from "@asledgehammer/pipewrench";

export type Fluid = "HumanMilk" | "Semen" | string;

export type FluidContainer = {
	removeFluid(): void;
	addFluid(type: any, amount: number): void;
	getCapacity(): number;
};

export type FluidContainerItem = {
	getFluidContainer(): FluidContainer;
};

export type CraftRecipeData = {
	getInputItems(index: number): ArrayList;
};

export type Recipe = {
	OnTest: Record<string, (item: InventoryItem, character: IsoGameCharacter) => boolean>;
	OnCreate: Record<string, (items: CraftRecipeData, character: IsoGameCharacter) => void>;
};