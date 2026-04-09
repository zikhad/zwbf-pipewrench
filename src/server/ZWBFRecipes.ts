import { ZombRandFloat, IsoGameCharacter, InventoryItem } from "@asledgehammer/pipewrench";
import { lactation, womb } from "@client/ZWBF";
import { Fluids } from "@constants";
import { Fluid, Recipe } from "server/types";

declare let ZWBFRecipes: Recipe;

/**
 * This function fills a given inventory item with a specified fluid and amount, if the item has a fluid container.
 * @param inventoryItem The inventory item to fill with fluid.
 * @param fluid The type of fluid to add to the container.
 * @param amount The amount of fluid to add to the container.
 * @return The amount of fluid that was actually added to the container, or 0 if the item does not have a fluid container or if the container is full.
 */
const fillContainerWithFluid = (inventoryItem: InventoryItem, fluid: Fluid, amount: number) => {
	if (!inventoryItem.getFluidContainer) return 0;
	const container = inventoryItem.getFluidContainer();
	if (!container) return 0;
	const addedFluid = Math.min(container.getFreeCapacity(), amount);
	container.addFluid(fluid, addedFluid);
	return addedFluid;
}

/**
 * This function clears the fluid from a given inventory item if it has a fluid container.
 * @param inventoryItem The inventory item to clear the fluid from.
 */
const clearContainer = (inventoryItem: InventoryItem) => {
	if (!inventoryItem.getFluidContainer) return;
	const container = inventoryItem.getFluidContainer();
	if (!container) return;
	container.removeFluid();
}

/**
 * Checks if the given inventory item has a fluid container and if it is full.
 * @param inventoryItem The inventory item to check for a fluid container and if it is full.
 * @returns true if the inventory item has a fluid container and it is full, false otherwise.
 */
const isContainerFull = (inventoryItem: InventoryItem): boolean => {
	if (!inventoryItem.getFluidContainer) return false;
	const container = inventoryItem.getFluidContainer();
	if (!container) return false;
	return container.isFull();
}

/**
 * Checks if the given inventory item has a fluid container and if it is empty.
 * @param inventoryItem The inventory item to check for a fluid container and if it is empty.
 * @returns true if the inventory item has a fluid container and it is empty, false otherwise.
 */
/* const isContainerEmpty = (inventoryItem: InventoryItem): boolean => {
	if (!inventoryItem.getFluidContainer) return false;
	const container = inventoryItem.getFluidContainer();
	if (!container) return false;
	return container.isEmpty();
}; */

ZWBFRecipes = {
	OnTest: {
		HandExpress: (item, character) => {
			if (!character.isFemale()) return false;
			if (isContainerFull(item)) return false;
			return lactation.milkAmount >= lactation.bottleAmount * 2;
		},
		BreastPump: (item, character) => {
			if (!character.isFemale()) return false;
			if (isContainerFull(item)) return false;
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount;
		},
		ClearSperm: (_item, character) => {
			if (!character.isFemale()) return false;
			return womb.amount > 0;
		}
	},
	OnCreate: {
		HandExpress: (items, _character) => {
			const container = items.getInputItems(0).get(0) as InventoryItem;
			const amount = fillContainerWithFluid(container, Fluids.HUMAN_MILK, lactation.bottleAmount);
			lactation.useMilk(amount * 2, ZombRandFloat(0.05, 0.1)); // Waste half of the milk when hand expressing
		},
		BreastPump: (items, _character) => {
			const container = items.getInputItems(1).get(0) as InventoryItem;
			const amount = fillContainerWithFluid(container, Fluids.HUMAN_MILK, lactation.bottleAmount);
			lactation.useMilk(amount, ZombRandFloat(0.1, 0.2));
		},
		ClearSperm: (items, _character) => {
			const container = items.getInputItems(0).get(0) as InventoryItem;
			clearContainer(container);
			womb.amount = 0;
		}
	}
};