import { ArrayList, InventoryItem, IsoGameCharacter } from "@asledgehammer/pipewrench";

export type Fluid = "HumanMilk" | "Semen" | string;

interface FluidContainer {
	removeFluid(): void;
	addFluid(type: any, amount: number): void;
	getCapacity(): number;
}

interface FluidContainerItem {
	getFluidContainer(): FluidContainer;
}

interface CraftRecipeData {
	getInputItems(index: number): ArrayList;
}

export type Recipe = {
	OnTest: Record<string, (item: InventoryItem, character: IsoGameCharacter) => boolean>;
	OnCreate: Record<string, (items: CraftRecipeData, character: IsoGameCharacter) => void>;
};