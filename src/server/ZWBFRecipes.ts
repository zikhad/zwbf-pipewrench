import { ZombRandFloat, IsoGameCharacter } from "@asledgehammer/pipewrench";
import { lactation, womb } from "@client/ZWBF";
import { Fluid } from "@constants";
import { Recipe } from "server/types";

declare let ZWBFRecipes: Recipe;

type FluidContainer = {
	removeFluid(): void;
	addFluid(type: any, amount: number): void;
	getCapacity(): number;
}
type InventoryItem = {
	getFluidContainer: () => FluidContainer | null;
}
type Inventory = {
	getFirstAvailableFluidContainer: (type: string) => InventoryItem;
}

/**
 * This function will fill the first available fluid container in the character's inventory with human milk.
 * It checks if the character has an inventory and if there is a fluid container available before adding the milk.
 * @param character The character whose inventory will be filled with human milk.
 * @param amount The amount of human milk to add to the container.
 */
const fillContainerWithHumanMilk = (character: IsoGameCharacter, amount: number) => {
	// TODO: agument type definitions of IsoGameCharacter.getInventory() to include getFirstAvailableFluidContainer
	const inventoryItems = (character.getInventory() as unknown as Inventory).getFirstAvailableFluidContainer(Fluid.HUMAN_MILK) 
	if (!inventoryItems) return;
	const container = inventoryItems.getFluidContainer();
	if (!container) return;
	container.addFluid(Fluid.HUMAN_MILK, amount);
};

ZWBFRecipes = {
	OnTest: {
		HandExpress: (_item, character) => {
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount * 2;
		},
		BreastPump: (_item, character) => {
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount;
		},
		ClearSperm: (_item, character) => {
			return character.isFemale() && womb.amount > 0;
		}
	},
	OnCreate: {
		HandExpress: (_items, character) => {
			const amount = lactation.bottleAmount;
			lactation.useMilk(amount * 2, ZombRandFloat(0.05, 0.1)); // Waste half of the milk when hand expressing
			fillContainerWithHumanMilk(character, amount);
		},
		BreastPump: (_items, character) => {
			const amount = lactation.bottleAmount;
			lactation.useMilk(amount, ZombRandFloat(0.1, 0.2));
			fillContainerWithHumanMilk(character, amount);
		},
		ClearSperm: (_items, _character) => {
			womb.amount = 0;
		}
	}
};