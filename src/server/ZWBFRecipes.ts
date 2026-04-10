import { ZombRandFloat, InventoryItem } from "@asledgehammer/pipewrench";
import { lactation, womb } from "@client/ZWBF";
import { Fluids } from "@constants";
import { Recipe } from "server/types";
import { FluidContainerApi } from "@shared/components/FluidContainerApi";

declare let ZWBFRecipes: Recipe;

ZWBFRecipes = {
	OnTest: {
		TakeContraceptive: (item, character) => {
			if (!character.isFemale()) return false;
			if (womb.contraceptive) return false;
			if (womb.pregnancy) return false;
			return true;
		},
		HandExpress: (item, character) => {
			if (!character.isFemale()) return false;
			if (new FluidContainerApi(item).isFull()) return false;
			return lactation.milkAmount >= lactation.bottleAmount * 2;
		},
		BreastPump: (item, character) => {
			if (!character.isFemale()) return false;
			if (new FluidContainerApi(item).isFull()) return false;
			return character.isFemale() && lactation.milkAmount >= lactation.bottleAmount;
		},
		ClearSperm: (_item, character) => {
			if (!character.isFemale()) return false;
			return womb.amount > 0;
		}
	},
	OnCreate: {
		TakeContraceptive: (_items, _character) => {
			womb.contraceptive = true;
		},
		HandExpress: (items, _character) => {
			const container = items.getInputItems(0).get(0) as InventoryItem;
			const amount = new FluidContainerApi(container).fill(Fluids.HUMAN_MILK, lactation.bottleAmount);
			lactation.useMilk(amount * 2, ZombRandFloat(0.05, 0.1)); // Waste half of the milk when hand expressing
		},
		BreastPump: (items, _character) => {
			const container = items.getInputItems(1).get(0) as InventoryItem;
			const amount = new FluidContainerApi(container).fill(Fluids.HUMAN_MILK, lactation.bottleAmount);
			lactation.useMilk(amount, ZombRandFloat(0.1, 0.2));
		},
		ClearSperm: (items, _character) => {
			const container = items.getInputItems(0).get(0) as InventoryItem;
			new FluidContainerApi(container).clear();
			womb.amount = 0;
		}
	}
};

export { ZWBFRecipes };

// ZWBFRecipes = ZWBFRecipesImpl;